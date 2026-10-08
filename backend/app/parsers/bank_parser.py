from pydantic import BaseModel
from typing import List
from datetime import date

class BankTransaction(BaseModel):
    date: date
    description: str
    credit: float
    debit: float
    balance: float
    category: str

def _categorize(desc: str) -> str:
    desc = desc.lower()
    if "salary" in desc: return "salary"
    if "rent" in desc: return "rent"
    if "emi" in desc: return "EMI"
    if "grocery" in desc: return "grocery"
    if "hospital" in desc or "medical" in desc: return "medical"
    return "other"

def parse_bank_csv(file_path: str) -> List[BankTransaction]:
    """Stub for bank CSV parsing."""
    return [
        BankTransaction(
            date=date.today(),
            description="SYNTHETIC SALARY",
            credit=100000.0,
            debit=0.0,
            balance=100000.0,
            category="salary"
        )
    ]

def parse_bank_pdf(file_path: str) -> List[BankTransaction]:
    return parse_bank_csv(file_path)
