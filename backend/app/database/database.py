import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.config import settings
from app.database import schema

logger = logging.getLogger(__name__)

VEC_AVAILABLE = False

def get_db_path() -> Path:
    # database.py lives at: backend/app/database/database.py
    # 4 parents up = repo root
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    db_rel = settings.DATABASE_PATH.lstrip("./")
    db_path = repo_root / db_rel
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    global VEC_AVAILABLE
    try:
        with get_db() as conn:
            conn.execute(schema.CREATE_DOCUMENTS_TABLE)
            conn.execute(schema.CREATE_CHUNKS_TABLE)
            conn.execute(schema.CREATE_CONVERSATIONS_TABLE)
            conn.execute(schema.CREATE_MESSAGES_TABLE)
            conn.execute(schema.CREATE_ASSETS_TABLE)
            conn.execute(schema.CREATE_LIABILITIES_TABLE)
            conn.execute(schema.CREATE_USER_PROFILE_TABLE)
            conn.execute(schema.INDEX_DOCUMENTS)
            conn.execute(schema.INDEX_MESSAGES)

            # Try to load sqlite-vec
            try:
                import sqlite_vec
                sqlite_vec.load(conn)
                VEC_AVAILABLE = True
                logger.info("sqlite-vec loaded successfully using python module.")
            except Exception as module_e:
                try:
                    conn.enable_load_extension(True)
                    conn.load_extension('vec0')
                    VEC_AVAILABLE = True
                    logger.info("sqlite-vec loaded successfully using load_extension.")
                except Exception as e:
                    logger.warning(f"Could not load sqlite-vec. Python module error: {module_e}, Extension error: {e}")
                    VEC_AVAILABLE = False

            if VEC_AVAILABLE:
                dim = settings.EMBEDDING_DIM
                conn.execute(f"CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(embedding float[{dim}]);")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
