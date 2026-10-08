with open("backend/app/database/database.py", "r") as f:
    content = f.read()
content = content.replace('conn.execute("PRAGMA foreign_keys = ON;")', 'conn.execute("PRAGMA foreign_keys = ON;")\n    conn.execute("PRAGMA journal_mode=WAL;")')
with open("backend/app/database/database.py", "w") as f:
    f.write(content)
