from fastapi import APIRouter
from app.intelligence.halo_score import compute_halo_score

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

@router.get("/halo-score")
def get_halo_score():
    score_obj = compute_halo_score({}, {}, {}, {})
    return {
        "score": score_obj.total_score,
        "breakdown": {
            "tax_efficiency": score_obj.tax_efficiency,
            "debt_health": score_obj.debt_health,
            "portfolio_cagr": score_obj.portfolio_cagr,
            "insurance_adequacy": score_obj.insurance_adequacy,
        }
    }
