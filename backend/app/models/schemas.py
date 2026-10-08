from enum import Enum

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    processing = 'processing'
    indexed = 'indexed'
    failed = 'failed'
    needs_reindex = 'needs_reindex'

class DocumentResponse(BaseModel):
    id: int
    filename: str
    source: str | None = None
    upload_date: str
    page_count: int
    chunk_count: int
    status: DocumentStatus
    file_path: str | None = None
    reconciled_assets: int = 0
    reconciled_liabilities: int = 0
    message: str | None = None

class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    conversation_id: str | None = None

class SourceCitation(BaseModel):
    document: str
    page: int | None = None
    section: str | None = None
    snippet: str
    score: float | None = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceCitation]
    confidence: float
    conversation_id: str
    processing_time_ms: int
    executed_tools: list[str] = []

class HealthResponse(BaseModel):
    status: str
    database: bool
    vector_store: bool
    llm_configured: bool
    embedding_configured: bool
    document_count: int
    chunk_count: int

class SettingsResponse(BaseModel):
    llm_provider: str
    llm_model: str
    embedding_model: str
    database_path: str
    top_k_results: int
    similarity_threshold: float
    local_mode: bool
    version: str

class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None

class ReindexResponse(BaseModel):
    document_id: int
    status: str
    chunks_created: int
    message: str
