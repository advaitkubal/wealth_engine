import re
from pathlib import Path


def sanitize_filename(filename: str) -> str:
    filename = Path(filename).name
    # Keep alphanumeric, dot, underscore, dash
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    return filename

def validate_pdf(file_path: Path) -> bool:
    ext = file_path.suffix.lower()
    if ext in ['.pdf', '.csv', '.json', '.txt', '.png', '.jpg', '.jpeg']:
        return True
    return False

def get_upload_dir() -> Path:
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    upload_dir = base_dir / 'data' / 'documents'
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir

def get_processed_dir() -> Path:
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    processed_dir = base_dir / 'data' / 'processed'
    processed_dir.mkdir(parents=True, exist_ok=True)
    return processed_dir

def format_file_size(num_bytes: int | float) -> str:
    size = float(num_bytes)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"
