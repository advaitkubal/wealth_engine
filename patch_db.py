import sqlite3
from backend.app.database.database import get_db_path

def migrate():
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    
    conn.execute("PRAGMA journal_mode=WAL;")
    
    tables = ['documents', 'document_chunks', 'conversations', 'messages', 'assets', 'liabilities']
    
    for table in tables:
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN profile_id INTEGER DEFAULT 1;")
        except sqlite3.OperationalError as e:
            # Column likely exists
            pass
            
        conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_profile_id ON {table}(profile_id);")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
