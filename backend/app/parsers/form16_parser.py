from pydantic import BaseModel
from typing import Dict, Optional

class Form16Data(BaseModel):
    employer_name: str
    tan: str
    pan_employee: str
    total_salary: int
    tax_deducted: int
    perquisites: int
    deductions_under_various_sections: Dict[str, int]

def parse_form16_pdf(file_path: str) -> Form16Data:
    """Stub for Form 16 parsing."""
    return Form16Data(
        employer_name="Synthetic Corp",
        tan="SYN12345C",
        pan_employee="ABCDE1234F",
        total_salary=1500000,
        tax_deducted=100000,
        perquisites=50000,
        deductions_under_various_sections={"80C": 150000}
    )
