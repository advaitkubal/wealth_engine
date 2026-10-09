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

    # 1. Synchronously extract portfolio data from PDF to update live Wealth Engine & Dashboard
    reconciled_assets = 0
    reconciled_liabs = 0
    from app.parsers.statement_extractor import extract_portfolio_from_pdf
    try:
        extracted = extract_portfolio_from_pdf(file_path)
        with database.get_db() as conn:
            # If assets were detected, replace or merge into live assets
            if extracted["assets"]:
                conn.execute("DELETE FROM assets")
                for a in extracted["assets"]:
                    conn.execute(
                        "INSERT INTO assets(type, label, value, yield_pct, created_at, updated_at) VALUES(?,?,?,?,?,?)",
                        (a["type"], a["label"], a["value"], a["yield_pct"], upload_date, upload_date)
                    )
                    reconciled_assets += 1

            # If liabilities were detected, replace or merge into live liabilities
            if extracted["liabilities"]:
                conn.execute("DELETE FROM liabilities")
                for l in extracted["liabilities"]:
                    conn.execute(
                        "INSERT INTO liabilities(type, label, remaining, rate, emi, tenure, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?)",
                        (l["type"], l["label"], l["remaining"], l["rate"], l["emi"], l["tenure"], upload_date, upload_date)
                    )
                    reconciled_liabs += 1
            # If income was detected, update user_profile table
            if extracted.get("gross_income") and extracted["gross_income"] > 0:
                ann_inc = extracted["gross_income"]
                # Approximate in-hand monthly after standard deduction & basic tax/PF (8% - 15% TDS)
                inhand_est = round((ann_inc * 0.82) / 12)
                conn.execute("DELETE FROM user_profile")
                conn.execute(
                    "INSERT INTO user_profile(annual_income, monthly_inhand, monthly_expenses, updated_at) VALUES(?,?,?,?)",
                    (ann_inc, inhand_est, 65000, upload_date)
                )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error extracting portfolio from PDF: {e}", exc_info=True)

    # 2. Add background semantic ingestion for RAG vector search
    background_tasks.add_task(ingestion_pipeline.ingest_pdf, file_path, doc_id, safe_name)

    msg = f"Reconciled {reconciled_assets} assets and {reconciled_liabs} liabilities into your live database!" if (reconciled_assets or reconciled_liabs) else "Document uploaded and indexed into local vector store."

    return DocumentResponse(
        id=doc_id,
        filename=safe_name,
        source="upload",
        upload_date=upload_date,
        page_count=1,
        chunk_count=0,
        status=DocumentStatus.processing,
        file_path=str(file_path),
        reconciled_assets=reconciled_assets,
        reconciled_liabilities=reconciled_liabs,
        message=msg
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

@router.post("/load-sample")
def load_sample_statement():
    sample_path = Path("SAMPLE_HDFC_CONSOLIDATED_STATEMENT.pdf")
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail="Sample statement file not found")

    from app.parsers.statement_extractor import extract_portfolio_from_pdf
    extracted = extract_portfolio_from_pdf(sample_path)
    now = datetime.datetime.now().isoformat()

    reconciled_assets = 0
    reconciled_liabs = 0

    with database.get_db() as conn:
        if extracted["assets"]:
            conn.execute("DELETE FROM assets")
            for a in extracted["assets"]:
                conn.execute(
                    "INSERT INTO assets(type, label, value, yield_pct, created_at, updated_at) VALUES(?,?,?,?,?,?)",
                    (a["type"], a["label"], a["value"], a["yield_pct"], now, now)
                )
                reconciled_assets += 1

        if extracted["liabilities"]:
            conn.execute("DELETE FROM liabilities")
            for l in extracted["liabilities"]:
                conn.execute(
                    "INSERT INTO liabilities(type, label, remaining, rate, emi, tenure, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?)",
                    (l["type"], l["label"], l["remaining"], l["rate"], l["emi"], l["tenure"], now, now)
                )
                reconciled_liabs += 1
        if extracted.get("gross_income") and extracted["gross_income"] > 0:
            ann_inc = extracted["gross_income"]
            inhand_est = round((ann_inc * 0.82) / 12)
            conn.execute("DELETE FROM user_profile")
            conn.execute(
                "INSERT INTO user_profile(annual_income, monthly_inhand, monthly_expenses, updated_at) VALUES(?,?,?,?)",
                (ann_inc, inhand_est, 65000, now)
            )

    return {
        "status": "success",
        "reconciled_assets": reconciled_assets,
        "reconciled_liabilities": reconciled_liabs,
        "message": f"Successfully parsed SAMPLE_HDFC_CONSOLIDATED_STATEMENT.pdf! Updated {reconciled_assets} assets and {reconciled_liabs} loans into your live SQLite database."
    }

