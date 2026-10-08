import logging
from pathlib import Path

from app.config import settings
from app.database import database, vector_store
from app.rag.embeddings import embedding_service

logger = logging.getLogger(__name__)

class IngestionPipeline:
    def ingest_pdf(self, file_path: Path, document_id: int, filename: str) -> dict:
        try:
            from langchain_community.document_loaders import PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            loader = PyPDFLoader(str(file_path))
            docs = loader.load()
            page_count = len(docs)

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP
            )
            chunks = splitter.split_documents(docs)
            chunk_count = len(chunks)

            # Prepare embeddings
            texts_to_embed = [c.page_content for c in chunks]
            embeddings: list[list[float]] | None = None
            if embedding_service.available:
                embeddings = embedding_service.embed_texts(texts_to_embed)

            with database.get_db() as conn:
                for i, chunk in enumerate(chunks):
                    text = chunk.page_content
                    page = chunk.metadata.get('page', 0) + 1

                    cursor = conn.execute(
                        "INSERT INTO document_chunks(document_id, page, text, chunk_index, char_count) VALUES (?, ?, ?, ?, ?)",
                        (document_id, page, text, i, len(text))
                    )
                    chunk_id = cursor.lastrowid

                    if embeddings and embeddings[i]:
                        vector_store.insert_embedding(conn, chunk_id, embeddings[i])

                # Update document
                conn.execute(
                    "UPDATE documents SET status = 'indexed', page_count = ?, chunk_count = ? WHERE id = ?",
                    (page_count, chunk_count, document_id)
                )

            logger.info(f"Ingested {filename}: {page_count} pages, {chunk_count} chunks")
            return {'page_count': page_count, 'chunk_count': chunk_count, 'status': 'indexed'}

        except Exception as e:
            logger.error(f"Failed to ingest {filename}: {e}")
            try:
                with database.get_db() as conn:
                    conn.execute("UPDATE documents SET status = 'failed' WHERE id = ?", (document_id,))
            except Exception:
                pass
            return {'error': str(e), 'status': 'failed'}

ingestion_pipeline = IngestionPipeline()
