from fastapi import APIRouter

from app.config import settings
from app.models.schemas import SettingsResponse

router = APIRouter()

@router.get("/settings", response_model=SettingsResponse)
def get_settings():
    local_mode = settings.LLM_PROVIDER == 'LOCAL' and not settings.OPENAI_API_KEY and not settings.ANTHROPIC_API_KEY
    return SettingsResponse(
        llm_provider=settings.LLM_PROVIDER,
        llm_model=settings.LOCAL_LLM_MODEL,
        embedding_model=settings.EMBEDDING_MODEL,
        database_path=settings.DATABASE_PATH,
        top_k_results=settings.TOP_K_RESULTS,
        similarity_threshold=settings.SIMILARITY_THRESHOLD,
        local_mode=local_mode,
        version="1.0.0"
    )
