with open("backend/app/main.py", "r") as f:
    content = f.read()
content = content.replace("from app.api import chat, documents, health, wealth", "from app.api import chat, documents, health, wealth, tax")
content = content.replace('app.include_router(wealth.router, prefix="/api")', 'app.include_router(wealth.router, prefix="/api")\napp.include_router(tax.router, prefix="/api")')
with open("backend/app/main.py", "w") as f:
    f.write(content)
