from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from app.rag.wealth_tools import parse_indian_currency

class GetPortfolioSummaryParams(BaseModel):
    pass

class AddAssetParams(BaseModel):
    type: Optional[str] = "Cash"
    label: str
    value: str
    yield_pct: float = 0.0

    @field_validator('value')
    def validate_value(cls, v):
        parsed = parse_indian_currency(v)
        if parsed < 0:
            raise ValueError("Asset value cannot be negative.")
        if parsed > 10_000_000_000:
            raise ValueError("Asset value cannot exceed 1000 Cr.")
        return v

class AddLiabilityParams(BaseModel):
    type: Optional[str] = "Loan"
    label: str
    value: str
    interest_rate: float = 0.0
    emi: str = "0"

    @field_validator('value', 'emi')
    def validate_value(cls, v):
        parsed = parse_indian_currency(v)
        if parsed < 0:
            raise ValueError("Value cannot be negative.")
        return v

    @field_validator('interest_rate')
    def validate_rate(cls, v):
        if not (0 <= v <= 50):
            raise ValueError("Interest rate must be between 0% and 50%.")
        return v

class DeleteAssetParams(BaseModel):
    asset_id: int

class DeleteLiabilityParams(BaseModel):
    liability_id: int

class ComputeIndianTaxParams(BaseModel):
    income: Any
    regime: Optional[str] = "new"
    deductions_80c: Any = "0"
    deductions_80d: Any = "0"
    deductions_24b: Any = "0"

    @field_validator('income', 'deductions_80c', 'deductions_80d', 'deductions_24b')
    def validate_income(cls, v):
        parsed = parse_indian_currency(str(v))
        if parsed < 0:
            raise ValueError("Amount cannot be negative.")
        if parsed > 1_000_000_000:
            raise ValueError("Amount cannot exceed 100 Cr.")
        return str(v)

    @field_validator('regime')
    def validate_regime(cls, v):
        v = (str(v) or "new").lower()
        if v not in ("new", "old"):
            raise ValueError("Regime must be 'new' or 'old'.")
        return v

class CalculateLoanAndEmiParams(BaseModel):
    principal: Any = "0"
    emi: Any = "0"
    rate: Any = "0"
    tenure_months: Any = "0"
    tenure_years: Any = "0"
    loan_type: Optional[str] = "Personal Loan"

    @field_validator('principal', 'emi', 'rate', 'tenure_months', 'tenure_years')
    def validate_positive(cls, v):
        parsed = parse_indian_currency(str(v))
        if parsed < 0:
            raise ValueError("Value cannot be negative.")
        return str(v)
    
    @field_validator('rate')
    def validate_rate(cls, v):
        parsed = parse_indian_currency(str(v))
        if parsed > 50:
            raise ValueError("Interest rate cannot exceed 50%.")
        return str(v)
    
    @field_validator('tenure_years')
    def validate_tenure(cls, v):
        parsed = parse_indian_currency(str(v))
        if parsed > 40:
            raise ValueError("Tenure cannot exceed 40 years.")
        return str(v)

TOOL_MODELS = {
    "get_portfolio_summary": GetPortfolioSummaryParams,
    "add_asset": AddAssetParams,
    "add_liability": AddLiabilityParams,
    "delete_asset": DeleteAssetParams,
    "delete_liability": DeleteLiabilityParams,
    "compute_indian_tax": ComputeIndianTaxParams,
    "calculate_loan_and_emi": CalculateLoanAndEmiParams,
}
