from typing import Any, Optional

from pydantic import BaseModel, field_validator

from app.rag.wealth_tools import parse_indian_currency


class GetPortfolioSummaryParams(BaseModel):
    pass

class AddAssetParams(BaseModel):
    type: Optional[str] = "Cash"
    label: Optional[str] = "Asset"
    value: Optional[Any] = "0"
    amount: Optional[Any] = None
    yield_pct: Optional[float] = 0.0

    @field_validator('value', 'amount')
    def validate_value(cls, v):
        if v is None:
            return v
        parsed = parse_indian_currency(v)
        if parsed < 0:
            raise ValueError("Asset value cannot be negative.")
        if parsed > 10_000_000_000:
            raise ValueError("Asset value cannot exceed 1000 Cr.")
        return str(v)

class AddLiabilityParams(BaseModel):
    type: Optional[str] = "Loan"
    label: Optional[str] = "Loan"
    remaining: Optional[Any] = "0"
    value: Optional[Any] = None
    amount: Optional[Any] = None
    rate: Optional[float] = 0.0
    interest_rate: Optional[float] = 0.0
    emi: Optional[Any] = "0"
    tenure: Optional[int] = 0

    @field_validator('remaining', 'value', 'amount', 'emi')
    def validate_value(cls, v):
        if v is None:
            return v
        parsed = parse_indian_currency(v)
        if parsed < 0:
            raise ValueError("Value cannot be negative.")
        return str(v)

    @field_validator('rate', 'interest_rate')
    def validate_rate(cls, v):
        if v is not None and not (0 <= v <= 50):
            raise ValueError("Interest rate must be between 0% and 50%.")
        return v

class DeleteAssetParams(BaseModel):
    asset_id: int

class DeleteLiabilityParams(BaseModel):
    liability_id: Optional[int] = None
    liab_id: Optional[int] = None

class ComputeIndianTaxParams(BaseModel):
    income: Optional[Any] = None
    gross_salary: Optional[Any] = None
    other_income: Optional[Any] = None
    side_income: Optional[Any] = None
    equity_stcg: Optional[Any] = None
    equity_ltcg: Optional[Any] = None
    debt_stcg: Optional[Any] = None
    home_loan_interest: Optional[Any] = None
    regime: Optional[str] = "new"
    fy: Optional[str] = "2024-25"
    deductions_80c: Optional[Any] = "0"
    deductions_80d: Optional[Any] = "0"
    deductions_24b: Optional[Any] = "0"

    @field_validator('regime')
    def validate_regime(cls, v):
        v = (str(v) or "new").lower()
        if "old" in v:
            return "old"
        return "new"

class ComputeSideIncomeTaxParams(BaseModel):
    side_income: Any = "0"
    base_salary: Optional[Any] = "24 lakhs"
    income_type: Optional[str] = "freelance"
    regime: Optional[str] = "new"
    fy: Optional[str] = "2024-25"

    @field_validator('side_income')
    def validate_side_income(cls, v):
        parsed = parse_indian_currency(str(v))
        if parsed < 0:
            raise ValueError("Side income cannot be negative.")
        if parsed > 1_000_000_000:
            raise ValueError("Side income cannot exceed 100 Cr.")
        return str(v)

    @field_validator('regime')
    def validate_regime(cls, v):
        v = (str(v) or "new").lower()
        if "old" in v:
            return "old"
        return "new"

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

class UpdateLiabilityParams(BaseModel):
    liab_id: Optional[int] = None
    loan_name: Optional[str] = None
    remaining: Optional[Any] = None
    rate: Optional[Any] = None
    emi: Optional[Any] = None
    tenure: Optional[Any] = None

class UpdateAssetParams(BaseModel):
    asset_id: Optional[int] = None
    asset_name: Optional[str] = None
    value: Optional[Any] = None
    yield_pct: Optional[Any] = None

TOOL_MODELS = {
    "get_portfolio_summary": GetPortfolioSummaryParams,
    "add_asset": AddAssetParams,
    "add_liability": AddLiabilityParams,
    "delete_asset": DeleteAssetParams,
    "delete_liability": DeleteLiabilityParams,
    "update_liability": UpdateLiabilityParams,
    "update_asset": UpdateAssetParams,
    "compute_indian_tax": ComputeIndianTaxParams,
    "compute_side_income_tax": ComputeSideIncomeTaxParams,
    "calculate_loan_and_emi": CalculateLoanAndEmiParams,
}
