from pydantic import BaseModel


class HaloScoreBreakdown(BaseModel):
    tax_efficiency: int
    debt_health: int
    portfolio_cagr: int
    insurance_adequacy: int
    total_score: int

def compute_halo_score(portfolio_summary: dict, tax_breakdown: dict, insurance_adequacy: dict, debt_strategy: dict) -> HaloScoreBreakdown:
    # Stub logic returning a deterministic score based on inputs
    # 0 - 1000 score
    return HaloScoreBreakdown(
        tax_efficiency=200,
        debt_health=220,
        portfolio_cagr=210,
        insurance_adequacy=220,
        total_score=850
    )
