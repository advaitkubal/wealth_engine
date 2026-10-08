from fastapi import APIRouter

from app.database import database
from app.models.schemas import HealthResponse
from app.rag.embeddings import embedding_service
from app.rag.llm import llm_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    db_ok = False
    doc_count = 0
    chunk_count = 0
    try:
        with database.get_db() as conn:
            row = conn.execute("SELECT COUNT(*) as c FROM documents").fetchone()
            doc_count = row['c'] if row else 0
            row2 = conn.execute("SELECT COUNT(*) as c FROM document_chunks").fetchone()
            chunk_count = row2['c'] if row2 else 0
            db_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="ok" if db_ok else "error",
        database=db_ok,
        vector_store=database.VEC_AVAILABLE,
        llm_configured=llm_service.is_available(),
        embedding_configured=embedding_service.available,
        document_count=doc_count,
        chunk_count=chunk_count
    )
