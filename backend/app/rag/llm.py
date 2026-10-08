import json
import logging
import re

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.available = False
        self.llm = None
        self._raw_client = None  # openai.OpenAI client for tool-calling

        provider = settings.LLM_PROVIDER
        base_url = settings.LOCAL_LLM_BASE_URL
        model = settings.LOCAL_LLM_MODEL

        if provider == 'LOCAL' and base_url and model:
            try:
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    base_url=base_url,
                    api_key="local",
                    model=model,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                )
                # Also keep a raw openai client for tool-calling (more reliable than LC)
                import openai
                self._raw_client = openai.OpenAI(
                    base_url=base_url,
                    api_key="local",
                )
                self._model = model
                self.available = True
                logger.info(f"LLM configured: {model} at {base_url}")
            except Exception as e:
                logger.warning(f"Failed to configure LLM: {e}")
        else:
            logger.warning(
                "LLM not fully configured (missing LOCAL_LLM_BASE_URL or LOCAL_LLM_MODEL). LLM disabled."
            )

    def generate(self, prompt: str, system: str) -> str | None:
        """Plain generation without tools."""
        if not self.available or not self.llm:
            return None

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [SystemMessage(content=system), HumanMessage(content=prompt)]
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            return None

    def generate_with_tools(self, messages: list, tools: list) -> dict:
        """
        Call the LLM with tool definitions. Returns a dict:
          { "content": str | None, "tool_calls": list[dict] }
        Each tool_call: { "name": str, "arguments": dict }
        """
        if not self.available or not self._raw_client:
            return {"content": None, "tool_calls": []}

        try:
            kwargs = {
                "model": self._model,
                "messages": messages,
                "temperature": settings.LLM_TEMPERATURE,
                "max_tokens": settings.LLM_MAX_TOKENS,
            }
            if tools:
                kwargs["tools"] = tools

            response = self._raw_client.chat.completions.create(**kwargs)
            choice = response.choices[0]
            content = choice.message.content or ""
            tool_calls = []
            if choice.message.tool_calls:
                for tc in choice.message.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments)
                    except Exception:
                        args = {}
                    tool_calls.append({
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": args,
                    })

            # Fallback: if model wrote raw JSON tool call into content instead of tool_calls
            if not tool_calls and content and "{" in content:
                known_tools = {
                    "update_liability", "add_liability", "delete_liability",
                    "update_asset", "add_asset", "delete_asset",
                    "compute_indian_tax", "calculate_loan_and_emi", "get_portfolio_summary"
                }
                start = content.find("{")
                end = content.rfind("}")
                if start != -1 and end != -1 and end > start:
                    raw_json = content[start:end+1]
                    # Repair common model syntax glitches like "tenure":}} or trailing commas
                    repaired = re.sub(r':\s*([,}])', r': null\1', raw_json)
                    repaired = re.sub(r',\s*}', '}', repaired)
                    try:
                        parsed = json.loads(repaired)
                        name = parsed.get("name") or parsed.get("tool")
                        args = parsed.get("parameters") or parsed.get("arguments") or {}
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except Exception:
                                args = {}
                        if name in known_tools:
                            tool_calls.append({
                                "id": "call_fallback_1",
                                "name": name,
                                "arguments": args,
                            })
                            # Clear content so raw JSON is not shown to user
                            content = content[:start].strip() + (" " if content[:start] and content[end+1:] else "") + content[end+1:].strip()
                            content = content.strip()
                    except Exception as parse_err:
                        logger.warning(f"Failed to parse fallback tool JSON: {parse_err}")

            return {"content": content, "tool_calls": tool_calls, "raw_message": choice.message}
        except Exception as e:
            logger.error(f"Error in generate_with_tools: {e}")
            return {"content": None, "tool_calls": []}

    def is_available(self) -> bool:
        return self.available


llm_service = LLMService()
