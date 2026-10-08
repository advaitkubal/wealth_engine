import logging

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.available = False
        self.embeddings = None

        try:
            # Prefer the newer langchain-huggingface package
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
            except ImportError:
                from langchain_community.embeddings import (
                    HuggingFaceEmbeddings,  # type: ignore
                )

            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.model_name,
                model_kwargs={'device': 'cpu'}  # Force CPU to avoid Apple Metal (MPS) concurrency crashes in FastAPI
            )
            self.available = True
            logger.info(f"Embedding model ready: {self.model_name} (on CPU)")
        except Exception as e:
            logger.warning(
                f"Embedding model '{self.model_name}' could not be loaded: {e}. "
                "Embeddings disabled until model is available."
            )

    def embed_text(self, text: str) -> list[float] | None:
        if not self.available or not self.embeddings:
            return None
        return self.embeddings.embed_query(text)

    def embed_texts(self, texts: list[str]) -> list[list[float]] | None:
        if not self.available or not self.embeddings:
            return None
        return self.embeddings.embed_documents(texts)

    def get_dimension(self) -> int | None:
        return settings.EMBEDDING_DIM if self.available else None


embedding_service = EmbeddingService()
