from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.intelligence.halo_score import compute_halo_score
from app.intelligence.what_if_engine import (
    analyze_job_switch,
    analyze_prepayment_vs_invest,
    compute_emergency_breakdown,
    CTCComparison,
    PrepaymentVsInvest,
    EmergencyRunway
)
from app.database import database

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

class JobSwitchRequest(BaseModel):
    current_ctc: float
    current_variable_pct: float = 10.0
    new_ctc: float
    new_variable_pct: float = 20.0
    new_esop_value: float = 0.0

@router.post("/job-switch", response_model=CTCComparison)
def job_switch_api(req: JobSwitchRequest):
    return analyze_job_switch(
        current_ctc=req.current_ctc,
        current_variable_pct=req.current_variable_pct,
        new_ctc=req.new_ctc,
        new_variable_pct=req.new_variable_pct,
        new_esop_value=req.new_esop_value
    )

class PrepayRequest(BaseModel):
    loan_principal: float = 6500000.0
    loan_rate_pct: float = 8.5
    tenure_months: int = 180
    lump_sum_amount: float = 1000000.0
    expected_mf_return_pct: float = 12.0

@router.post("/prepay-vs-invest", response_model=PrepaymentVsInvest)
def prepay_vs_invest_api(req: PrepayRequest):
    return analyze_prepayment_vs_invest(
        loan_principal=req.loan_principal,
        loan_rate_pct=req.loan_rate_pct,
        tenure_months=req.tenure_months,
        lump_sum_amount=req.lump_sum_amount,
        expected_mf_return_pct=req.expected_mf_return_pct
    )

class EmergencyRequest(BaseModel):
    monthly_expenses: float = 75000.0

@router.post("/emergency-runway", response_model=EmergencyRunway)
def emergency_runway_api(req: EmergencyRequest):
    with database.get_db() as conn:
        assets = [dict(r) for r in conn.execute("SELECT * FROM assets ORDER BY id").fetchall()]
        liabs = [dict(r) for r in conn.execute("SELECT * FROM liabilities ORDER BY id").fetchall()]
    return compute_emergency_breakdown(assets, liabs, req.monthly_expenses)
