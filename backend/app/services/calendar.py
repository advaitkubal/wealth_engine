from pydantic import BaseModel
from datetime import date
from typing import List

class FinancialEvent(BaseModel):
    date: date
    title: str
    description: str

def get_financial_events(fy: str) -> List[FinancialEvent]:
    return [
        FinancialEvent(date=date(2024, 6, 15), title="Advance Tax Q1", description="15% of tax liability due"),
        FinancialEvent(date=date(2024, 7, 31), title="ITR Filing", description="Last date to file ITR without penalty")
    ]
