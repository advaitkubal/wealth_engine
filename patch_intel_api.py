with open("backend/app/api/wealth.py", "r") as f:
    content = f.read()

new_api = """
from app.intelligence.halo_score import compute_halo_score

@router.get("/intelligence/halo-score")
def get_halo_score():
    score = compute_halo_score({}, {}, {}, {})
    return {"score": score.total_score, "breakdown": score.model_dump()}
"""

if "get_halo_score" not in content:
    with open("backend/app/api/wealth.py", "a") as f:
        f.write("\n" + new_api)
