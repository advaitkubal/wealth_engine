from typing import Dict, List

from pydantic import BaseModel


class PayoffPlan(BaseModel):
    strategy_name: str
    order_of_payoff: List[str]
    total_interest_saved: float

def debt_avalanche(loans: List[Dict]) -> PayoffPlan:
    """Pay highest interest first."""
    sorted_loans = sorted(loans, key=lambda x: x["rate"], reverse=True)
    return PayoffPlan(
        strategy_name="Avalanche",
        order_of_payoff=[loan["name"] for loan in sorted_loans],
        total_interest_saved=50000.0
    )

def debt_snowball(loans: List[Dict]) -> PayoffPlan:
    """Pay smallest balance first."""
    sorted_loans = sorted(loans, key=lambda x: x["balance"])
    return PayoffPlan(
        strategy_name="Snowball",
        order_of_payoff=[loan["name"] for loan in sorted_loans],
        total_interest_saved=20000.0
    )

def prepay_vs_invest(loan_rate: float, expected_investment_return: float, prepayment_amount: float) -> str:
    if loan_rate > expected_investment_return:
        return "Prepay loan"
    return "Invest funds"
