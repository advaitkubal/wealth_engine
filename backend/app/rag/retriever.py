import logging

from app.config import settings
from app.database import database, vector_store
from app.rag.embeddings import embedding_service

logger = logging.getLogger(__name__)

class Retriever:
    def retrieve(self, question: str, top_k: int | None = None, threshold: float | None = None) -> list[dict]:
        if top_k is None:
            top_k = settings.TOP_K_RESULTS
        if threshold is None:
            threshold = settings.SIMILARITY_THRESHOLD

        if not embedding_service.available:
            logger.warning("Embeddings not available. Cannot retrieve documents.")
            return []

        query_emb = embedding_service.embed_text(question)
        if not query_emb:
            return []

        try:
            with database.get_db() as conn:
                results = vector_store.search_similar(conn, query_emb, top_k, threshold)
                return results
        except Exception as e:
            logger.error(f"Retrieval error: {e}")
            return []

    def format_context(self, chunks: list[dict]) -> str:
        if not chunks:
            return ""

        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source = f"[{i}] {chunk.get('document_name', 'Unknown')}"
            if chunk.get('page'):
                source += f", Page {chunk['page']}"
            context_parts.append(f"{source}:\n{chunk['text']}\n")

        return "\n".join(context_parts)

retriever = Retriever()
