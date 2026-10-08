import datetime
import shutil
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from app.config import settings
from app.database import database, vector_store
from app.models.schemas import (
    DocumentListResponse,
    DocumentResponse,
    DocumentStatus,
    ReindexResponse,
)
from app.rag.ingestion import ingestion_pipeline
from app.utils.file_utils import get_upload_dir, sanitize_filename, validate_pdf

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if file.size and file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    upload_dir = get_upload_dir()
    safe_name = sanitize_filename(file.filename or "uploaded.pdf")
    file_path = upload_dir / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if not validate_pdf(file_path):
        file_path.unlink()
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    upload_date = datetime.datetime.now().isoformat()

    with database.get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO documents (filename, source, upload_date, status, file_path) VALUES (?, ?, ?, ?, ?)",
            (safe_name, "upload", upload_date, DocumentStatus.processing.value, str(file_path))
        )
        doc_id = cursor.lastrowid

    background_tasks.add_task(ingestion_pipeline.ingest_pdf, file_path, doc_id, safe_name)

    return DocumentResponse(
        id=doc_id,
        filename=safe_name,
        source="upload",
        upload_date=upload_date,
        page_count=0,
        chunk_count=0,
        status=DocumentStatus.processing,
        file_path=str(file_path)
    )

@router.get("", response_model=DocumentListResponse)
def list_documents():
    docs = []
    with database.get_db() as conn:
        cursor = conn.execute("SELECT * FROM documents ORDER BY id DESC")
        for row in cursor:
            docs.append(DocumentResponse(
                id=row['id'],
                filename=row['filename'],
                source=row['source'],
                upload_date=row['upload_date'],
                page_count=row['page_count'],
                chunk_count=row['chunk_count'],
                status=DocumentStatus(row['status']),
                file_path=row['file_path']
            ))
    return DocumentListResponse(documents=docs, total=len(docs))

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: int):
    with database.get_db() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        return DocumentResponse(
            id=row['id'],
            filename=row['filename'],
            source=row['source'],
            upload_date=row['upload_date'],
            page_count=row['page_count'],
            chunk_count=row['chunk_count'],
            status=DocumentStatus(row['status']),
            file_path=row['file_path']
        )

@router.delete("/{doc_id}")
def delete_document(doc_id: int):
    with database.get_db() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        vector_store.delete_document_embeddings(conn, doc_id)
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))

        file_path = row['file_path']
        if file_path:
            p = Path(file_path)
            if p.exists():
                p.unlink()

    return {"status": "success"}

@router.post("/{doc_id}/reindex", response_model=ReindexResponse)
def reindex_document(doc_id: int, background_tasks: BackgroundTasks):
    with database.get_db() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        vector_store.delete_document_embeddings(conn, doc_id)
        conn.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
        conn.execute("UPDATE documents SET status = ?, page_count = 0, chunk_count = 0 WHERE id = ?", (DocumentStatus.processing.value, doc_id))

        file_path = row['file_path']
        filename = row['filename']

    if file_path and Path(file_path).exists():
        background_tasks.add_task(ingestion_pipeline.ingest_pdf, Path(file_path), doc_id, filename)
        return ReindexResponse(document_id=doc_id, status="processing", chunks_created=0, message="Reindexing started")
    else:
        raise HTTPException(status_code=400, detail="File not found for reindexing")
