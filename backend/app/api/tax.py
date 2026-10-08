from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/tax", tags=["Tax"])
RULES_DIR = Path("backend/app/rules")

def find_unverified(data, path=""):
    items = []
    if isinstance(data, dict):
        if "verified" in data:
            if not data["verified"]:
                items.append({"path": path, "status": "unverified", "value": data})
            else:
                items.append({"path": path, "status": "verified", "value": data})
        for k, v in data.items():
            if k == "verified":
                continue
            new_path = f"{path}.{k}" if path else k
            items.extend(find_unverified(v, new_path))
    elif isinstance(data, list):
        for i, v in enumerate(data):
            new_path = f"{path}[{i}]"
            items.extend(find_unverified(v, new_path))
    return items

@router.get("/rules-status")
def get_rules_status():
    status_list = []
    for p in RULES_DIR.glob("fy_*.json"):
        fy = p.stem.replace("fy_", "").replace("_", "-")
        with p.open() as f:
            data = json.load(f)
            
        items = find_unverified(data)
        status_list.append({
            "fy": fy,
            "filename": p.name,
            "source_url": data.get("source_url", "Unknown"),
            "items": items,
            "raw_rules": data
        })
    return status_list
