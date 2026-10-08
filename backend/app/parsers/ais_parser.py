from pydantic import BaseModel
from typing import List, Dict

class AISData(BaseModel):
    interest_income: int
    dividend_income: int
    capital_gains: Dict[str, int]
    salary: int
    tds_entries: List[Dict[str, int]]

def parse_ais_json(file_path: str) -> AISData:
    """Stub for AIS JSON parsing."""
    return AISData(
        interest_income=10000,
        dividend_income=5000,
        capital_gains={"equity_stcg": 50000},
        salary=1500000,
        tds_entries=[{"tax_deducted": 100000}]
    )
