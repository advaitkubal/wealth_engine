from pathlib import Path

from pydantic_settings import BaseSettings

# Repo root is two levels above this file (backend/app/config.py → backend/ → repo root)
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    APP_NAME: str = "Halo"
    ENVIRONMENT: str = "development"

    # LLM
    LLM_PROVIDER: str = "LOCAL"
    LOCAL_LLM_BASE_URL: str = ""
    LOCAL_LLM_MODEL: str = ""

    # Embeddings
    EMBEDDING_PROVIDER: str = "LOCAL"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384

    # Database
    DATABASE_PATH: str = "./data/halo.db"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Optional cloud keys (never sent externally unless provider set)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # RAG tuning
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.3
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    MAX_RETRIEVAL_RETRIES: int = 2

    # LLM generation
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 2048

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = {
        "env_file": str(_ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()

