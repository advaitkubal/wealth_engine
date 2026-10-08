from datetime import date
from typing import Dict, List

from pydantic import BaseModel


class CapitalGainsReport(BaseModel):
    total_stcg: float
    total_ltcg: float
    tax_loss_harvesting_suggestion: str

def compute_portfolio_gains(holdings: List[Dict], sale_date: date, sale_price_per_unit: float) -> CapitalGainsReport:
    """Stub for portfolio gains calculation."""
    return CapitalGainsReport(
        total_stcg=0.0,
        total_ltcg=150000.0,
        tax_loss_harvesting_suggestion="Harvest 25k losses to offset STCG."
    )
