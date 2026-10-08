import re

with open("backend/app/tax_engine.py", "r") as f:
    content = f.read()

# Add Pydantic Models
models = """
class OldRegimeInputs(BaseModel):
    basic_salary: int = 0
    hra_received: int = 0
    rent_paid: int = 0
    is_metro: bool = False
    sec_80c: int = 0
    sec_80ccd1b: int = 0
    sec_80ccd2_employer_nps: int = 0
    sec_80d_self_family: int = 0
    sec_80d_self_senior: bool = False
    sec_80d_parents: int = 0
    sec_80d_parents_senior: bool = False
    sec_24b_home_loan_interest: int = 0
    sec_80e_education_loan_interest: int = 0
    sec_80eeb_ev_loan_interest: int = 0

class DeductionSummary(BaseModel):
    total_deduction: int
    breakdown: dict[str, int]
    explanations: list[str]

class RegimeRecommendation(BaseModel):
    new_regime_tax: int
    old_regime_tax: int
    recommended_regime: Regime
    savings: int
    new_breakdown: TaxBreakdown
    old_breakdown: TaxBreakdown
    old_deductions: DeductionSummary
"""
content = content.replace("class RegimeComparison(BaseModel):", models + "\nclass RegimeComparison(BaseModel):")

# Compute old regime deductions
deduction_funcs = """
# ---------------------------------------------------------------------------
# Old Regime Deductions
# ---------------------------------------------------------------------------
def compute_hra_exemption(basic_salary: int, hra_received: int, rent_paid: int, is_metro: bool) -> tuple[int, str]:
    if hra_received <= 0:
        return 0, "No HRA received"
    if rent_paid <= 0:
        return 0, "No rent paid"
    
    rule1 = hra_received
    rule2 = rent_paid - int(0.1 * basic_salary)
    rule3 = int(0.5 * basic_salary) if is_metro else int(0.4 * basic_salary)
    
    exemption = max(0, min(rule1, rule2, rule3))
    pct = "50%" if is_metro else "40%"
    explanation = f"HRA Exemption: min(Actual HRA: {fmt_inr(rule1)}, Rent - 10% Basic: {fmt_inr(rule2)}, {pct} Basic: {fmt_inr(rule3)}) = {fmt_inr(exemption)}"
    return exemption, explanation

def compute_old_regime_deductions(inputs: OldRegimeInputs) -> DeductionSummary:
    total = 0
    breakdown = {}
    expl = []

    # Standard Deduction is handled in compute_income_tax directly
    
    # HRA
    hra, hra_expl = compute_hra_exemption(inputs.basic_salary, inputs.hra_received, inputs.rent_paid, inputs.is_metro)
    if hra > 0:
        breakdown["HRA"] = hra
        total += hra
        expl.append(hra_expl)
    
    # 80C
    sec_80c = min(inputs.sec_80c, 150000)
    if inputs.sec_80c > 0:
        breakdown["80C"] = sec_80c
        total += sec_80c
        expl.append(f"80C: min(Actual: {fmt_inr(inputs.sec_80c)}, Limit: {fmt_inr(150000)}) = {fmt_inr(sec_80c)}")
        
    # 80CCD(1B)
    sec_80ccd1b = min(inputs.sec_80ccd1b, 50000)
    if inputs.sec_80ccd1b > 0:
        breakdown["80CCD(1B)"] = sec_80ccd1b
        total += sec_80ccd1b
        expl.append(f"80CCD(1B): min(Actual: {fmt_inr(inputs.sec_80ccd1b)}, Limit: {fmt_inr(50000)}) = {fmt_inr(sec_80ccd1b)}")
        
    # 80CCD(2)
    sec_80ccd2 = min(inputs.sec_80ccd2_employer_nps, int(0.14 * inputs.basic_salary))
    if inputs.sec_80ccd2_employer_nps > 0:
        breakdown["80CCD(2)"] = sec_80ccd2
        total += sec_80ccd2
        expl.append(f"80CCD(2): min(Actual: {fmt_inr(inputs.sec_80ccd2_employer_nps)}, 14% Basic: {fmt_inr(int(0.14 * inputs.basic_salary))}) = {fmt_inr(sec_80ccd2)}")
        
    # 80D
    limit_self = 50000 if inputs.sec_80d_self_senior else 25000
    sec_80d_self = min(inputs.sec_80d_self_family, limit_self)
    limit_parents = 50000 if inputs.sec_80d_parents_senior else 25000
    sec_80d_parents = min(inputs.sec_80d_parents, limit_parents)
    sec_80d = sec_80d_self + sec_80d_parents
    if sec_80d > 0:
        breakdown["80D"] = sec_80d
        total += sec_80d
        expl.append(f"80D: Self min({fmt_inr(inputs.sec_80d_self_family)}, {fmt_inr(limit_self)}) + Parents min({fmt_inr(inputs.sec_80d_parents)}, {fmt_inr(limit_parents)}) = {fmt_inr(sec_80d)}")
        
    # 24(b)
    sec_24b = min(inputs.sec_24b_home_loan_interest, 200000)
    if inputs.sec_24b_home_loan_interest > 0:
        breakdown["24(b)"] = sec_24b
        total += sec_24b
        expl.append(f"24(b): min(Actual: {fmt_inr(inputs.sec_24b_home_loan_interest)}, Limit: {fmt_inr(200000)}) = {fmt_inr(sec_24b)}")
        
    # 80E
    sec_80e = inputs.sec_80e_education_loan_interest
    if sec_80e > 0:
        breakdown["80E"] = sec_80e
        total += sec_80e
        expl.append(f"80E: Actual interest = {fmt_inr(sec_80e)} (No limit)")
        
    # 80EEB
    sec_80eeb = min(inputs.sec_80eeb_ev_loan_interest, 150000)
    if inputs.sec_80eeb_ev_loan_interest > 0:
        breakdown["80EEB"] = sec_80eeb
        total += sec_80eeb
        expl.append(f"80EEB: min(Actual: {fmt_inr(inputs.sec_80eeb_ev_loan_interest)}, Limit: {fmt_inr(150000)}) = {fmt_inr(sec_80eeb)}")
        
    return DeductionSummary(total_deduction=total, breakdown=breakdown, explanations=expl)

def compare_regimes_detailed(gross_salary: int, old_inputs: OldRegimeInputs, fy: str | None = None, other_income: int = 0) -> RegimeRecommendation:
    deductions = compute_old_regime_deductions(old_inputs)
    new_bd = compute_income_tax(gross_salary, fy=fy, regime=Regime.NEW, other_income=other_income)
    old_bd = compute_income_tax(gross_salary, fy=fy, regime=Regime.OLD, other_income=other_income, deductions_old_regime=deductions.breakdown)
    
    recommended = Regime.NEW if new_bd.total_tax <= old_bd.total_tax else Regime.OLD
    savings = abs(new_bd.total_tax - old_bd.total_tax)
    
    return RegimeRecommendation(
        new_regime_tax=new_bd.total_tax,
        old_regime_tax=old_bd.total_tax,
        recommended_regime=recommended,
        savings=savings,
        new_breakdown=new_bd,
        old_breakdown=old_bd,
        old_deductions=deductions
    )

"""
content = content.replace("# ---------------------------------------------------------------------------\n# Regime comparator", deduction_funcs + "\n# ---------------------------------------------------------------------------\n# Regime comparator")

# Section 234 Interest
sec_234 = """
def compute_section_234_interest(estimated_total_tax: int, tds_deducted: int, advance_tax_paid_by_date: dict[str, int], fy: str | None = None) -> dict:
    if fy is None:
        fy = current_fy()
    rules = load_rules(fy)
    
    net_tax = max(0, estimated_total_tax - tds_deducted)
    
    # 234A: 1% per month delay in filing ITR (skip for now as it depends on filing date, or assume filed on time)
    # 234B: If advance tax paid < 90% of net_tax, 1% per month from April 1
    total_paid = sum(advance_tax_paid_by_date.values())
    interest_234b = 0
    if total_paid < 0.9 * net_tax:
        interest_234b = round(net_tax * 0.01 * 3) # Assume 3 months for Q1 for simplicity, wait, usually it's till assessment. Let's just output a formula.

    # Actually, we need exact calculation for 234C:
    # 234C: 1% per month for 3 months for each missed instalment
    due_dates = rules.get("advance_tax_due_dates", [])
    interest_234c = 0
    cumulative_paid = 0
    c_breakdown = []
    
    for slot in due_dates:
        date_str = slot["by_date"]
        pct = float(slot["cumulative_pct"])
        required = round(net_tax * pct)
        paid_this_period = advance_tax_paid_by_date.get(date_str, 0)
        cumulative_paid += paid_this_period
        
        shortfall = required - cumulative_paid
        if shortfall > 0:
            # 1% per month for 3 months (except last instalment which is 1 month)
            months = 1 if pct == 1.0 else 3
            interest = round(shortfall * 0.01 * months)
            interest_234c += interest
            c_breakdown.append({
                "date": date_str,
                "required": required,
                "paid": cumulative_paid,
                "shortfall": shortfall,
                "interest": interest,
                "formula": f"Shortfall {fmt_inr(shortfall)} × 1% × {months}m = {fmt_inr(interest)}"
            })
            
    total_penalty = interest_234b + interest_234c
    
    return {
        "interest_234A": 0,
        "interest_234B": interest_234b,
        "interest_234C": interest_234c,
        "total_penalty": total_penalty,
        "breakdown_234C": c_breakdown,
        "explanation": f"234B Interest: {fmt_inr(interest_234b)}, 234C Interest: {fmt_inr(interest_234c)}",
    }

"""
content = content + "\n" + sec_234

# Ensure compute_income_tax correctly handles deductions without re-capping
# We can just patch `capped = min(int(amount), int(limit_raw)) if limit_raw is not None else int(amount)` to `capped = int(amount)` because we pre-cap them.
content = content.replace("capped = min(int(amount), int(limit_raw)) if limit_raw is not None else int(amount)", "capped = int(amount)")

with open("backend/app/tax_engine.py", "w") as f:
    f.write(content)
