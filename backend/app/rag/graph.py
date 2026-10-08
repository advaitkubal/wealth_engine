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

    # First call: build the initial message list
    if not messages:
        user_content = prompts.RAG_PROMPT_TEMPLATE.format(
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
