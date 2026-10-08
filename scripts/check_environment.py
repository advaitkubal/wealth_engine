import sys
import importlib.util
import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

def check_env():
    print("Checking environment...")
    
    # 1. Python >= 3.10
    if sys.version_info >= (3, 10):
        print(f"✓ Python version {sys.version_info.major}.{sys.version_info.minor} >= 3.10")
    else:
        print(f"✗ Python version {sys.version_info.major}.{sys.version_info.minor} < 3.10. Upgrade required.")

    # 2. Required packages
    packages = ["fastapi", "uvicorn", "pydantic", "langchain", "langgraph", "sqlite_vec", "dotenv"]
    for pkg in packages:
        if importlib.util.find_spec(pkg):
            print(f"✓ Package {pkg} is installed")
        else:
            print(f"✗ Package {pkg} is missing")

    # 3. SQLite version
    print(f"✓ SQLite version: {sqlite3.sqlite_version}")

    # 4. sqlite_vec availability
    try:
        conn = sqlite3.connect(":memory:")
        try:
            import sqlite_vec
            sqlite_vec.load(conn)
            print("✓ sqlite_vec extension loads successfully")
        except Exception:
            conn.enable_load_extension(True)
            conn.load_extension('vec0')
            print("✓ sqlite_vec extension loads successfully via vec0")
    except Exception as e:
        print(f"✗ sqlite_vec extension failed to load: {e}")

    # 5. .env file
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        print(f"✓ .env file exists at {env_path}")
        load_dotenv(env_path)
    else:
        print(f"✗ .env file not found at {env_path}")

    # 6. Database path
    db_path = os.getenv("DATABASE_PATH", "./data/halo.db")
    db_full = (Path(__file__).resolve().parent.parent / db_path).parent
    try:
        db_full.mkdir(parents=True, exist_ok=True)
        if os.access(db_full, os.W_OK):
            print(f"✓ Database directory {db_full} is writable")
        else:
            print(f"✗ Database directory {db_full} is not writable")
    except Exception as e:
        print(f"✗ Failed to create/check database directory: {e}")

    # 7. LLM configured
    llm_url = os.getenv("LOCAL_LLM_BASE_URL")
    if llm_url:
        print(f"✓ LLM base URL configured: {llm_url}")
    else:
        print("✗ LOCAL_LLM_BASE_URL is not configured in .env")

    # 8. Embedding model
    emb_model = os.getenv("EMBEDDING_MODEL")
    if emb_model:
        print(f"✓ Embedding model configured: {emb_model}")
    else:
        print("✗ EMBEDDING_MODEL is not configured in .env")

    print("\nSummary and next steps:")
    print("- Ensure you have set your LOCAL_LLM_BASE_URL in .env if it is marked as missing.")
    print("- Run `scripts/setup.sh` to install dependencies and initialize the database.")

if __name__ == "__main__":
    check_env()
