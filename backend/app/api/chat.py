import datetime
import json
import time
import uuid

from fastapi import APIRouter, HTTPException

from app.database import database
from app.models.schemas import ChatRequest, ChatResponse, SourceCitation
from app.rag.graph import run_rag_pipeline

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest):
    start_time = time.time()

    try:
        result = run_rag_pipeline(request.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    processing_time = int((time.time() - start_time) * 1000)

    conversation_id = request.conversation_id or str(uuid.uuid4())
    now = datetime.datetime.now().isoformat()

    with database.get_db() as conn:
        # ensure conversation exists
        row = conn.execute("SELECT id FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
        if not row:
            title = request.question[:50] + "..." if len(request.question) > 50 else request.question
            conn.execute("INSERT INTO conversations(id, created_at, updated_at, title) VALUES (?, ?, ?, ?)",
                         (conversation_id, now, now, title))

        # save user message
        conn.execute("INSERT INTO messages(conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                     (conversation_id, "user", request.question, now))

        # save assistant message
        sources_json = json.dumps(result["sources"])
        conn.execute("INSERT INTO messages(conversation_id, role, content, created_at, sources_json) VALUES (?, ?, ?, ?, ?)",
                     (conversation_id, "assistant", result["answer"], now, sources_json))

        conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, conversation_id))

    citations = [SourceCitation(**s) for s in result["sources"]]

    return ChatResponse(
        answer=result["answer"],
        sources=citations,
        confidence=result["confidence"],
        conversation_id=conversation_id,
        processing_time_ms=processing_time,
        executed_tools=result.get("executed_tools", [])
    )

@router.get("/conversations")
def list_conversations():
    convs = []
    with database.get_db() as conn:
        for row in conn.execute("SELECT * FROM conversations ORDER BY updated_at DESC"):
            convs.append(dict(row))
    return convs

@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str):
    with database.get_db() as conn:
        conv = conn.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,)).fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = []
        for row in conn.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC", (conv_id,)):
            msg = dict(row)
            if msg.get("sources_json"):
                msg["sources"] = json.loads(msg["sources_json"])
            messages.append(msg)

    res = dict(conv)
    res["messages"] = messages
    return res

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str):
    with database.get_db() as conn:
        conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    return {"status": "success"}
