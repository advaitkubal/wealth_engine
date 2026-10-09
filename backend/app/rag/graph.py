"""
graph.py  —  Halo AI pipeline with Wealth Engine tool-calling support.

Flow:
  1. process_query     — clean question
  2. retrieve_docs     — RAG from uploaded PDFs
  3. generate_with_tools — call LLM with tool schemas + RAG context
  4. execute_tools     — if LLM called tools, run them and loop back
  5. format_citations  — build source list
  → END
"""

import logging

from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

from app.config import settings
from app.rag import prompts
from app.rag.embeddings import embedding_service
from app.rag.llm import llm_service
from app.rag.retriever import retriever
from app.rag.wealth_tools import TOOLS, execute_tool

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5  # prevent infinite loops

# ── State ────────────────────────────────────────────────────────────────────

class GraphState(TypedDict):
    question:           str
    processed_question: str
    retrieved_chunks:   list
    context:            str
    answer:             str
    sources:            list
    confidence:         float
    retry_count:        int
    error:              str | None
    # tool-calling state
    messages:           list   # full OpenAI-format message history as plain dicts
    tool_rounds:        int    # how many tool-call rounds we've done
    _tool_calls:        list   # pending tool calls from the last LLM response
    executed_tools:     list   # tools executed during this run


# ── Nodes ────────────────────────────────────────────────────────────────────

def process_query(state: GraphState):
    return {"processed_question": state["question"].strip(), "tool_rounds": 0, "messages": [], "executed_tools": []}


def retrieve_documents(state: GraphState):
    chunks = retriever.retrieve(state["processed_question"])
    return {"retrieved_chunks": chunks}


def check_relevance(state: GraphState):
    chunks = state["retrieved_chunks"]
    if not chunks:
        return {"confidence": 0.0}
    max_score = max(c.get("score", 0) for c in chunks)
    return {"confidence": max_score}


def get_live_user_context_string() -> str:
    """
    Builds a real-time, personalized financial context string directly from the user's
    live SQLite database (assets, liabilities, user_profile, documents).
    """
    from app.database import database
    from app.tax_engine import fmt_inr
    
    try:
        with database.get_db() as conn:
            prof = conn.execute("SELECT annual_income, monthly_inhand, monthly_expenses FROM user_profile LIMIT 1").fetchone()
            annual_inc = int(prof["annual_income"]) if prof and prof["annual_income"] else 2400000
            monthly_inhand = int(prof["monthly_inhand"]) if prof and prof["monthly_inhand"] else 160000
            monthly_exp = int(prof["monthly_expenses"]) if prof and prof["monthly_expenses"] else 55000

            asset_rows = [dict(r) for r in conn.execute("SELECT type, label, value, yield_pct FROM assets ORDER BY value DESC").fetchall()]
            total_assets = int(sum(r["value"] for r in asset_rows))

            liab_rows = [dict(r) for r in conn.execute("SELECT type, label, remaining, rate, emi, tenure FROM liabilities ORDER BY remaining DESC").fetchall()]
            total_debt = int(sum(r["remaining"] for r in liab_rows))
            total_emi = int(sum(r["emi"] for r in liab_rows))

            doc_rows = [dict(r) for r in conn.execute("SELECT filename, status FROM documents ORDER BY id DESC LIMIT 5").fetchall()]

            net_worth = total_assets - total_debt
            monthly_surplus = max(0, monthly_inhand - total_emi - monthly_exp)

            lines = [
                "=== LIVE PERSONAL FINANCIAL PROFILE (100% On-Device Synced Data) ===",
                f"• User Name: Advait",
                f"• Consolidated Net Worth: {fmt_inr(net_worth)}",
                f"• Total Assets: {fmt_inr(total_assets)} ({len(asset_rows)} holdings):",
            ]
            for a in asset_rows:
                lines.append(f"   - {a['type']}: {fmt_inr(int(a['value']))} — {a['label']} (Expected yield: {a['yield_pct']}% p.a.)")

            lines.append(f"• Active Debt & Loans: {fmt_inr(total_debt)} ({len(liab_rows)} active loans, Total EMI: {fmt_inr(total_emi)}/month):")
            for l in liab_rows:
                lines.append(f"   - {l['type']}: {fmt_inr(int(l['remaining']))} balance — {l['label']} @ {l['rate']}% interest, EMI: {fmt_inr(int(l['emi']))}/mo, {l['tenure']} months left")

            lines.append(f"• Income & Cash Flow:")
            lines.append(f"   - Annual Salary (Gross CTC): {fmt_inr(annual_inc)}")
            lines.append(f"   - Monthly In-Hand Take-Home: {fmt_inr(monthly_inhand)} / month")
            lines.append(f"   - Monthly Living Expenses: {fmt_inr(monthly_exp)} / month")
            lines.append(f"   - Monthly Net Surplus (Savings Potential): {fmt_inr(monthly_surplus)} / month")

            if doc_rows:
                docs_str = ", ".join([f"{d['filename']} ({d['status']})" for d in doc_rows])
                lines.append(f"• Synced Statement Documents: {docs_str}")

            lines.append("=========================================================================")
            return "\n".join(lines)
    except Exception as e:
        logger.warning(f"Error building live user context: {e}")
        return ""


def generate_with_tools(state: GraphState):
    """
    Build the message list and call the LLM with tools.
    The LLM may respond with plain text OR with tool calls.
    Only plain dicts are stored in state so LangGraph can serialise them.
    """
    chunks     = state.get("retrieved_chunks", [])
    confidence = state.get("confidence", 0.0)
    messages   = state.get("messages", [])

    # Build RAG context string
    context_str = ""
    if chunks and confidence >= settings.SIMILARITY_THRESHOLD:
        context_str = retriever.format_context(chunks)

    # First call: build the initial message list with live user portfolio context
    if not messages:
        user_profile_context = get_live_user_context_string()
        user_content = prompts.RAG_PROMPT_TEMPLATE.format(
            user_profile_context=user_profile_context,
            context=context_str,
            question=state["question"],
        )
        messages = [
            {"role": "system", "content": prompts.SYSTEM_PROMPT},
            {"role": "user",   "content": user_content},
        ]

    result     = llm_service.generate_with_tools(messages, TOOLS)
    content    = result.get("content") or ""
    tool_calls = result.get("tool_calls", [])  # list of plain dicts
    raw_msg    = result.get("raw_message")

    # Deterministic intent fallback (Rule 2: AI never guesses math, tools always compute)
    import re
    q = state.get("question", "").lower()
    tool_rounds = state.get("tool_rounds", 0)

    if not tool_calls and tool_rounds == 0:
        # Check user's live salary from DB
        from app.database import database
        with database.get_db() as conn:
            row = conn.execute("SELECT annual_income FROM user_profile LIMIT 1").fetchone()
            live_sal = int(row['annual_income']) if row and row['annual_income'] else 2400000

        # Check for side income query intent
        m_side = (
            re.search(r'(?:side|freelance|consulting|gig|extra|additional)\s+income.*?(?:of\s+)?([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))', q) or
            re.search(r'(?:tax|kitna|calculate).*?(?:side|freelance|consulting|gig)\s+income.*?(?:of\s+)?([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))', q) or
            re.search(r'(?:new\s+)?side\s+income\s+(?:of\s+)?([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))', q)
        )
        if m_side:
            val_str = m_side.group(1).strip()
            tool_calls.append({
                "id": "call_auto_side_tax",
                "name": "compute_side_income_tax",
                "arguments": {"side_income": val_str, "base_salary": f"{live_sal}"}
            })
        elif re.search(r'add\s+([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))\s+(?:to\s+)?(?:my\s+)?(?:networth|net\s*worth|portfolio)', q):
            m_net = re.search(r'add\s+([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))\s+(?:to\s+)?(?:my\s+)?(?:networth|net\s*worth|portfolio)', q)
            val_str = m_net.group(1).strip()
            tool_calls.append({
                "id": "call_auto_add_asset",
                "name": "add_asset",
                "arguments": {"label": "Liquid Savings", "type": "Cash", "value": val_str}
            })
        elif re.search(r'(?:calculate|compute|what is)\s+(?:my\s+)?tax\s+(?:on|for)\s+([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))', q):
            m_tax = re.search(r'(?:calculate|compute|what is)\s+(?:my\s+)?tax\s+(?:on|for)\s+([₹\d\.]+\s*(?:cr|crore|lakh|lakhs|lac|lacs|l|k|thousand|\d+))', q)
            val_str = m_tax.group(1).strip()
            tool_calls.append({
                "id": "call_auto_tax",
                "name": "compute_indian_tax",
                "arguments": {"gross_salary": val_str}
            })

    # Convert the raw SDK message to a plain dict so LangGraph can store it
    if raw_msg is not None:
        try:
            assistant_dict = {"role": "assistant", "content": content or ""}
            # Attach tool_calls field if present (needed for the API round-trip)
            if hasattr(raw_msg, "tool_calls") and raw_msg.tool_calls:
                assistant_dict["tool_calls"] = [
                    {
                        "id":       tc.id,
                        "type":     "function",
                        "function": {
                            "name":      tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in raw_msg.tool_calls
                ]
            messages.append(assistant_dict)
        except Exception as e:
            logger.warning(f"Could not serialise raw_message, using plain text: {e}")
            messages.append({"role": "assistant", "content": content})
    else:
        messages.append({"role": "assistant", "content": content})

    return {
        "messages":    messages,
        "answer":      content,
        "context":     context_str,
        "_tool_calls": tool_calls,
    }



def validate_tools_node(state: GraphState):
    from pydantic import ValidationError

    from app.rag.tool_validators import TOOL_MODELS

    tool_calls = state.get("_tool_calls", [])
    messages = state.get("messages", [])
    rounds = state.get("tool_rounds", 0)

    validated_calls = []
    errors = []

    for tc in tool_calls:
        name = tc.get("name")
        args = tc.get("arguments", {})
        model = TOOL_MODELS.get(name)

        if not model:
            validated_calls.append(tc)
            continue

        try:
            model(**args)
            validated_calls.append(tc)
        except ValidationError as e:
            error_msg = f"Validation error for tool '{name}': {e}"
            errors.append(error_msg)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.get("id", name),
                "content": f"ERROR: Invalid arguments for {name}. {e}\nPlease correct the arguments and try again."
            })

    if errors:
        return {
            "messages": messages,
            "tool_rounds": rounds + 1,
            "_tool_calls": validated_calls,
            "error": "\n".join(errors)
        }

    return {
        "_tool_calls": validated_calls
    }

def execute_tools_node(state: GraphState):
    """Run each tool the LLM requested and append results as plain dicts."""
    tool_calls = state.get("_tool_calls", [])
    messages   = state.get("messages", [])
    rounds     = state.get("tool_rounds", 0)
    executed   = list(state.get("executed_tools", []))

    for tc in tool_calls:
        tool_result = execute_tool(tc["name"], tc["arguments"])
        logger.info(f"Tool '{tc['name']}' → {tool_result[:200]}")
        executed.append(tc["name"])

        content_to_pass = tool_result
        if tool_result.startswith("ERROR"):
            content_to_pass = f"[CRITICAL TOOL ERROR: {tool_result}\nThe database was NOT updated. You must honestly inform the user that the action failed and explain what is missing. DO NOT claim that it succeeded.]"
        elif tc["name"] == "compute_side_income_tax":
            content_to_pass += "\n\n[INSTRUCTION: Present the exact final calculated figures to the user clearly: State the Net In-Hand money (Take-Home), the Incremental Tax payable, the marginal tax rate, and the Section 44ADA tax savings if applicable. Do NOT merely recite raw tax slabs—give the calculated end results directly.]"
        elif tc["name"] == "compute_indian_tax":
            content_to_pass += "\n\n[INSTRUCTION: Present this full breakdown, slice-by-slice calculation, deductions, and total tax payable to the user in a clear table or structured list.]"
        elif tc["name"] == "calculate_loan_and_emi":
            content_to_pass += "\n\n[INSTRUCTION: Present this exact loan analysis to the user: state the Effective Annual Interest Rate (APR), total interest paid, preclosure recommendation, and applicable Indian tax deductions clearly.]"
        elif tc["name"] in ("add_asset", "add_liability", "update_asset", "update_liability"):
            content_to_pass += "\n\n[INSTRUCTION: Confirm what was successfully updated/added in the database, mentioning the exact name, amount, and the updated net worth.]"

        messages.append({
            "role":         "tool",
            "tool_call_id": tc.get("id", tc["name"]),
            "content":      content_to_pass,
        })

    return {
        "messages":       messages,
        "tool_rounds":    rounds + 1,
        "_tool_calls":    [],
        "executed_tools": executed,
    }


def format_citations(state: GraphState):
    chunks     = state.get("retrieved_chunks", [])
    confidence = state.get("confidence", 0.0)

    if confidence < settings.SIMILARITY_THRESHOLD:
        return {"sources": []}

    sources = []
    for c in chunks:
        sources.append({
            "document": c.get("document_name", "Unknown"),
            "page":     c.get("page"),
            "section":  c.get("section"),
            "snippet":  c.get("text", "")[:200] + "...",
            "score":    c.get("score"),
        })
    return {"sources": sources}


# ── Routing ──────────────────────────────────────────────────────────────────

def route_after_generate(state: GraphState):
    tool_calls  = state.get("_tool_calls", [])
    tool_rounds = state.get("tool_rounds", 0)

    if tool_calls and tool_rounds < MAX_TOOL_ROUNDS:
        return "validate_tools"
    return "citations"


def route_after_tools(state: GraphState):
    """After executing tools, always go back to the LLM to produce a final answer."""
    return "generate"


# ── Graph ────────────────────────────────────────────────────────────────────

workflow = StateGraph(GraphState)
workflow.add_node("process",       process_query)
workflow.add_node("retrieve",      retrieve_documents)
workflow.add_node("check",         check_relevance)
workflow.add_node("generate",      generate_with_tools)
workflow.add_node("validate_tools", validate_tools_node)
workflow.add_node("execute_tools", execute_tools_node)
workflow.add_node("citations",     format_citations)

workflow.set_entry_point("process")
workflow.add_edge("process",  "retrieve")
workflow.add_edge("retrieve", "check")
workflow.add_edge("check",    "generate")

workflow.add_conditional_edges(
    "generate",
    route_after_generate,
    {"validate_tools": "validate_tools", "citations": "citations"},
)
workflow.add_edge("validate_tools", "execute_tools")
workflow.add_edge("execute_tools", "generate")
workflow.add_edge("citations", END)

app_graph = workflow.compile()


# ── Public entry point ───────────────────────────────────────────────────────

def run_rag_pipeline(question: str) -> dict:
    if not llm_service.is_available():
        return {
            "answer":     "The AI model is not configured. Please check that Ollama is running.",
            "sources":    [],
            "confidence": 0.0,
        }
    if not embedding_service.available:
        return {
            "answer":     "The embedding model is not available. The backend is still starting up.",
            "sources":    [],
            "confidence": 0.0,
        }

    initial_state: GraphState = {
        "question":           question,
        "processed_question": "",
        "retrieved_chunks":   [],
        "context":            "",
        "answer":             "",
        "sources":            [],
        "confidence":         0.0,
        "retry_count":        0,
        "error":              None,
        "messages":           [],
        "tool_rounds":        0,
        "_tool_calls":        [],
    }

    try:
        result = app_graph.invoke(initial_state)
        answer = result.get("answer", "").strip()
        if not answer:
            answer = "Sorry, I could not generate a response at this time."
        return {
            "answer":         answer,
            "sources":        result.get("sources", []),
            "confidence":     result.get("confidence", 0.0),
            "executed_tools": result.get("executed_tools", []),
        }
    except Exception as e:
        logger.error(f"RAG pipeline error: {e}")
        return {
            "answer":         f"An error occurred while processing your request: {e!s}",
            "sources":        [],
            "confidence":     0.0,
            "executed_tools": [],
        }
