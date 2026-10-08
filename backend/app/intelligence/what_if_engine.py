from typing import List, Dict, Any
from pydantic import BaseModel

class CTCComparison(BaseModel):
    current_ctc: float
    current_monthly_inhand: float
    current_annual_tax: float
    new_ctc: float
    new_monthly_inhand: float
    new_annual_tax: float
    monthly_inhand_delta: float
    annual_inhand_delta: float
    effective_hike_pct: float
    verdict: str
    recommendation: str

def analyze_job_switch(
    current_ctc: float,
    current_variable_pct: float,
    new_ctc: float,
    new_variable_pct: float,
    new_esop_value: float = 0.0,
    fy: str = "2024-25"
) -> CTCComparison:
    """
    Computes real monthly take-home salary after Indian income tax, standard deduction,
    EPF employee contribution (12% of basic, basic assumed 50% of fixed CTC),
    and variable pay uncertainty.
    """
    # Current fixed vs variable
    cur_variable = current_ctc * (current_variable_pct / 100.0)
    cur_fixed = current_ctc - cur_variable
    cur_basic = cur_fixed * 0.50
    cur_epf_annual = min(cur_basic * 0.12, 180000.0) # Employee EPF
    
    # Rough New Regime tax calculation on guaranteed income
    cur_taxable = max(0.0, cur_fixed - 75000.0) # standard deduction 75k
    cur_tax = _estimate_new_regime_tax(cur_taxable)
    cur_guaranteed_inhand_annual = cur_fixed - cur_tax - cur_epf_annual
    cur_monthly_inhand = cur_guaranteed_inhand_annual / 12.0

    # New fixed vs variable
    new_variable = new_ctc * (new_variable_pct / 100.0)
    new_fixed = new_ctc - new_variable
    new_basic = new_fixed * 0.50
    new_epf_annual = min(new_basic * 0.12, 180000.0)
    
    new_taxable = max(0.0, new_fixed - 75000.0)
    new_tax = _estimate_new_regime_tax(new_taxable)
    new_guaranteed_inhand_annual = new_fixed - new_tax - new_epf_annual
    new_monthly_inhand = new_guaranteed_inhand_annual / 12.0

    monthly_delta = new_monthly_inhand - cur_monthly_inhand
    annual_delta = new_guaranteed_inhand_annual - cur_guaranteed_inhand_annual
    effective_hike = ((new_monthly_inhand / cur_monthly_inhand) - 1.0) * 100.0 if cur_monthly_inhand > 0 else 0.0

    if monthly_delta > 20000:
        verdict = "Strong Financial Upgrade"
        rec = f"Guaranteed in-hand increases by ₹{int(monthly_delta):,}/month. Great offer."
    elif monthly_delta > 5000:
        verdict = "Moderate Increase"
        rec = f"In-hand increases by ₹{int(monthly_delta):,}/month. Check if higher stress or relocation justifies this."
    elif monthly_delta >= 0:
        verdict = "Marginal or Phantom Hike"
        rec = f"Despite higher paper CTC, guaranteed monthly in-hand increases by only ₹{int(monthly_delta):,}. High variable pay inflates CTC."
    else:
        verdict = "In-Hand Cash Reduction!"
        rec = f"Warning: High variable portion results in ₹{abs(int(monthly_delta)):,}/month LOWER monthly guaranteed cash!"

    return CTCComparison(
        current_ctc=current_ctc,
        current_monthly_inhand=round(cur_monthly_inhand, 2),
        current_annual_tax=round(cur_tax, 2),
        new_ctc=new_ctc,
        new_monthly_inhand=round(new_monthly_inhand, 2),
        new_annual_tax=round(new_tax, 2),
        monthly_inhand_delta=round(monthly_delta, 2),
        annual_inhand_delta=round(annual_delta, 2),
        effective_hike_pct=round(effective_hike, 2),
        verdict=verdict,
        recommendation=rec
    )

def _estimate_new_regime_tax(taxable_income: float) -> float:
    """Budget 2024 New Regime Slabs:
       0-4L: 0%
       4-8L: 5%
       8-12L: 10%
       12-16L: 15%
       16-20L: 20%
       20-24L: 25%
       >24L: 30%
    """
    if taxable_income <= 700000:
        return 0.0 # 87A rebate
    slabs = [
        (400000, 0.0),
        (400000, 0.05),
        (400000, 0.10),
        (400000, 0.15),
        (400000, 0.20),
        (400000, 0.25),
        (float('inf'), 0.30)
    ]
    tax = 0.0
    rem = taxable_income
    for size, rate in slabs:
        chunk = min(rem, size)
        tax += chunk * rate
        rem -= chunk
        if rem <= 0:
            break
    # 4% Health & Education cess
    return tax * 1.04

class PrepaymentVsInvest(BaseModel):
    prepay_interest_saved: float
    investment_future_value: float
    wealth_advantage: str
    net_gain: float
    recommendation: str

def analyze_prepayment_vs_invest(
    loan_principal: float,
    loan_rate_pct: float,
    tenure_months: int,
    lump_sum_amount: float,
    expected_mf_return_pct: float = 12.0
) -> PrepaymentVsInvest:
    """
    Compares using a lump-sum to prepay an active loan vs investing the lump-sum in equity mutual funds.
    """
    # 1. Total interest saved if prepaid now
    # Approximation: interest saved over the tenure for the lump_sum portion
    years = tenure_months / 12.0
    # Compounded investment value: A = P * (1 + r)^t
    mf_fv = lump_sum_amount * ((1 + (expected_mf_return_pct / 100.0)) ** years)
    mf_profit = mf_fv - lump_sum_amount
    # Subtract 12.5% LTCG tax above 1.25L
    taxable_gain = max(0.0, mf_profit - 125000.0)
    post_tax_mf_gain = mf_profit - (taxable_gain * 0.125)

    # Loan interest saved:
    r_monthly = (loan_rate_pct / 100.0) / 12.0
    # Interest saved approximately:
    interest_saved = lump_sum_amount * (loan_rate_pct / 100.0) * (years * 0.6) # amortizing reduction factor

    if post_tax_mf_gain > interest_saved:
        advantage = "Investing in Equity Mutual Funds"
        net_diff = post_tax_mf_gain - interest_saved
        rec = f"Investing wins by ₹{int(net_diff):,} post-tax over {int(years)} years. Your investment return ({expected_mf_return_pct}%) beats loan cost ({loan_rate_pct}%)."
    else:
        advantage = "Prepaying the Loan"
        net_diff = interest_saved - post_tax_mf_gain
        rec = f"Prepaying wins by ₹{int(net_diff):,}. Loan rate ({loan_rate_pct}%) is high, guaranteed debt freedom beats market risk."

    return PrepaymentVsInvest(
        prepay_interest_saved=round(interest_saved, 2),
        investment_future_value=round(lump_sum_amount + post_tax_mf_gain, 2),
        wealth_advantage=advantage,
        net_gain=round(net_diff, 2),
        recommendation=rec
    )

class EmergencyRunway(BaseModel):
    monthly_mandatory_burn: float
    tier1_instant_cash: float
    tier2_liquid_funds: float
    tier3_locked_assets: float
    total_liquid: float
    runway_months: float
    zero_income_survival_date: str
    status: str
    action_item: str

def compute_emergency_breakdown(
    assets: List[Dict[str, Any]],
    liabilities: List[Dict[str, Any]],
    monthly_living_expenses: float = 75000.0
) -> EmergencyRunway:
    """
    Computes 3-Tier Emergency Liquidity & Runway in months against mandatory living expenses + EMIs.
    """
    total_emi = sum(float(l.get("emi", 0)) for l in liabilities)
    monthly_burn = monthly_living_expenses + total_emi

    tier1 = 0.0 # Cash, Bank Savings
    tier2 = 0.0 # Liquid Mutual Funds, Fixed Deposits
    tier3 = 0.0 # Real Estate, PPF, Equity

    for a in assets:
        atype = a.get("type", "").lower()
        val = float(a.get("value", 0))
        if "cash" in atype or "savings" in atype:
            tier1 += val
        elif "fixed deposit" in atype or "fd" in atype or "liquid" in atype:
            tier2 += val
        elif "mutual funds" in atype:
            tier2 += val * 0.70 # assume 70% can be liquidated in T+2
            tier3 += val * 0.30
        else:
            tier3 += val

    total_liquid = tier1 + tier2
    runway_months = total_liquid / monthly_burn if monthly_burn > 0 else 99.0

    import datetime
    today = datetime.date.today()
    days_left = int(runway_months * 30.4)
    zero_date = (today + datetime.timedelta(days=days_left)).strftime("%d %B %Y")

    if runway_months >= 12.0:
        status = "Bulletproof (12+ Months)"
        action = "Excellent liquidity. No additional emergency allocation needed."
    elif runway_months >= 6.0:
        status = "Healthy (6-12 Months)"
        action = "Meets standard recommendations for salaried professionals."
    elif runway_months >= 3.0:
        status = "Vulnerable (3-6 Months)"
        action = f"Add ₹{int((6.0 - runway_months) * monthly_burn):,} to Tier 1/2 to reach the recommended 6-month safety buffer."
    else:
        status = "Critical Alert (<3 Months)"
        action = f"High default risk during income disruption. Immediately build an emergency fund of at least ₹{int(3 * monthly_burn):,}."

    return EmergencyRunway(
        monthly_mandatory_burn=round(monthly_burn, 2),
        tier1_instant_cash=round(tier1, 2),
        tier2_liquid_funds=round(tier2, 2),
        tier3_locked_assets=round(tier3, 2),
        total_liquid=round(total_liquid, 2),
        runway_months=round(runway_months, 1),
        zero_income_survival_date=zero_date,
        status=status,
        action_item=action
    )
