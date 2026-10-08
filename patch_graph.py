import re

with open("backend/app/rag/graph.py", "r") as f:
    content = f.read()

validate_code = """
def validate_tools_node(state: GraphState):
    from app.rag.tool_validators import TOOL_MODELS
    from pydantic import ValidationError
    
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
                "content": f"ERROR: Invalid arguments for {name}. {e}\\nPlease correct the arguments and try again."
            })
            
    if errors:
        return {
            "messages": messages,
            "tool_rounds": rounds + 1,
            "_tool_calls": validated_calls,
            "error": "\\n".join(errors)
        }
        
    return {
        "_tool_calls": validated_calls
    }
"""

content = content.replace("def execute_tools_node(state: GraphState):", validate_code + "\ndef execute_tools_node(state: GraphState):")
content = content.replace('{"execute_tools": "execute_tools", "citations": "citations"}', '{"validate_tools": "validate_tools", "citations": "citations"}')
content = content.replace('return "execute_tools"', 'return "validate_tools"')
content = content.replace('workflow.add_node("execute_tools", execute_tools_node)', 'workflow.add_node("validate_tools", validate_tools_node)\nworkflow.add_node("execute_tools", execute_tools_node)')
content = content.replace('workflow.add_conditional_edges(\n    "generate",\n    route_after_generate,\n    {"validate_tools": "validate_tools", "citations": "citations"},\n)', 'workflow.add_conditional_edges(\n    "generate",\n    route_after_generate,\n    {"validate_tools": "validate_tools", "citations": "citations"},\n)\nworkflow.add_edge("validate_tools", "execute_tools")')

with open("backend/app/rag/graph.py", "w") as f:
    f.write(content)
