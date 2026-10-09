CREATE_DOCUMENTS_TABLE = '''
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    source TEXT,
    upload_date TEXT,
    page_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'processing',
    file_path TEXT
);
'''

CREATE_CHUNKS_TABLE = '''
CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    page INTEGER,
    section TEXT,
    text TEXT NOT NULL,
    chunk_index INTEGER,
    char_count INTEGER
);
'''

CREATE_CONVERSATIONS_TABLE = '''
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    created_at TEXT,
    updated_at TEXT,
    title TEXT
);
'''

CREATE_MESSAGES_TABLE = '''
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT,
    content TEXT,
    created_at TEXT,
    sources_json TEXT
);
'''

INDEX_DOCUMENTS = '''
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id);
'''

INDEX_MESSAGES = '''
CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);
'''

CREATE_ASSETS_TABLE = '''
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    yield_pct REAL NOT NULL DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);
'''

CREATE_LIABILITIES_TABLE = '''
CREATE TABLE IF NOT EXISTS liabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    remaining REAL NOT NULL DEFAULT 0,
    rate REAL NOT NULL DEFAULT 0,
    emi REAL NOT NULL DEFAULT 0,
    tenure INTEGER NOT NULL DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);
'''

CREATE_USER_PROFILE_TABLE = '''
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    annual_income REAL NOT NULL DEFAULT 2400000,
    monthly_inhand REAL NOT NULL DEFAULT 160000,
    monthly_expenses REAL NOT NULL DEFAULT 55000,
    updated_at TEXT
);
'''
