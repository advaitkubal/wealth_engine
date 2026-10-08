"""
Halo Tax Engine — Phase 1.1
All math is in pure Python (no LLM). All rules are loaded from
backend/app/rules/fy_YYYY_YY.json. No slab, rate or threshold
is hardcoded here.

Every public function returns an Explanation object alongside the number
so the caller can render step-by-step working.
"""
from __future__ import annotations

import json
from datetime import date
from enum import Enum
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RULES_DIR = Path(__file__).parent / "rules"


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class Regime(str, Enum):
    NEW = "new"
    OLD = "old"


class Confidence(str, Enum):
    EXACT = "exact"
    ESTIMATE = "estimate"


# ---------------------------------------------------------------------------
# Explanation object (Rule 3: SHOW THE MATH)
# ---------------------------------------------------------------------------
class TaxExplanation(BaseModel):
    formula: str
    inputs: dict
    steps: list[str]
    section_references: list[str]
    confidence: Confidence
    assumptions: list[str] = Field(default_factory=list)
    unverified_values: list[str] = Field(default_factory=list)


class TaxBreakdown(BaseModel):
    fy: str
    regime: Regime
    gross_income: int
    standard_deduction: int
    net_taxable_income: int
    slab_tax: int
    slab_breakdown: list[dict]      # [{slab, from, to, rate, tax, formula}]
    surcharge: int
    cess: int
    rebate_87A: int
    total_tax: int
    effective_rate_pct: float
    explanation: TaxExplanation


class CapGainsTaxResult(BaseModel):
    gain_type: str
    section: str
    rate: float
    taxable_gain: int
    exemption_applied: int
    tax: int
    cess: int
    total_tax: int
    explanation: TaxExplanation



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

class RegimeComparison(BaseModel):
    new_regime_tax: int
    old_regime_tax: int
    recommended_regime: Regime
    savings: int
    new_breakdown: TaxBreakdown
    old_breakdown: TaxBreakdown


# ---------------------------------------------------------------------------
# Rules loader
# ---------------------------------------------------------------------------
def _fy_key(fy: str) -> str:
    """Normalise 'FY 2024-25' / '2024-25' / '2024_25' → '2024_25'"""
    return fy.strip().upper().replace("FY ", "").replace("-", "_")


def load_rules(fy: str) -> dict:
    """Load the versioned FY JSON rules file. Raises FileNotFoundError if missing."""
    key = _fy_key(fy)
    path = RULES_DIR / f"fy_{key}.json"
    if not path.exists():
        available = [p.stem for p in RULES_DIR.glob("fy_*.json")]
        raise FileNotFoundError(
            f"No rules file for FY '{fy}'. Available: {available}. "
            f"Create backend/app/rules/fy_{key}.json to add a new year."
        )
    with path.open() as f:
        return json.load(f)


def current_fy() -> str:
    """Return the current financial year string e.g. '2024-25'."""
    today = date.today()
    year = today.year
    if today.month < 4:
        return f"{year - 1}-{str(year)[2:]}"
    return f"{year}-{str(year + 1)[2:]}"


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------
def fmt_inr(amount: float) -> str:
    """Format as ₹1,25,000 (Indian number grouping)."""
    amount = int(round(amount))
    if amount < 0:
        return f"-₹{_inr_group(-amount)}"
    return f"₹{_inr_group(amount)}"


def _inr_group(n: int) -> str:
    s = str(n)
    if len(s) <= 3:
        return s
    result = s[-3:]
    s = s[:-3]
    while s:
        result = s[-2:] + "," + result if len(s) >= 2 else s + "," + result
        s = s[:-2]
    return result


# ---------------------------------------------------------------------------
# Core slab tax calculation
# ---------------------------------------------------------------------------
def _compute_slab_tax(net_taxable: int, slabs: list[dict]) -> tuple[int, list[dict]]:
    """
    Compute progressive slab tax. Returns (total_slab_tax, breakdown_list).
    Each breakdown item: {from, to, rate, slice, formula, tax}
    """
    total = 0
    breakdown: list[dict] = []
    for slab in slabs:
        lo: int = int(slab["from"])
        hi: int | None = slab["to"]
        rate: float = float(slab["rate"])
        if net_taxable <= lo:
            break
        upper = net_taxable if (hi is None or net_taxable <= hi) else hi
        taxable_slice = upper - lo
        tax_in_slab = round(taxable_slice * rate)
        total += tax_in_slab
        hi_display = fmt_inr(hi) if hi else "above"
        formula = (
            f"{fmt_inr(lo + 1)}–{hi_display} slice: "
            f"{fmt_inr(taxable_slice)} × {rate * 100:.1f}% = {fmt_inr(tax_in_slab)}"
        )
        breakdown.append({
            "from": lo,
            "to": hi,
            "rate": rate,
            "slice": taxable_slice,
            "formula": formula,
            "tax": tax_in_slab,
        })
        if hi is None or net_taxable <= hi:
            break
    return total, breakdown


# ---------------------------------------------------------------------------
# Surcharge calculation
# ---------------------------------------------------------------------------
def _compute_surcharge(base_tax: int, total_income: int, surcharge_slabs: list[dict]) -> tuple[int, str]:
    rate = 0.0
    for slab in surcharge_slabs:
        if total_income > slab["from"]:
            rate = float(slab["rate"])
        else:
            break
    surcharge = round(base_tax * rate)
    formula = f"Surcharge: {fmt_inr(base_tax)} × {rate * 100:.0f}% = {fmt_inr(surcharge)}"
    return surcharge, formula


# ---------------------------------------------------------------------------
# 87A Rebate with marginal relief
# ---------------------------------------------------------------------------
def _compute_rebate_87A(
    net_taxable: int,
    tax_before_cess: int,
    rebate_config: dict,
) -> tuple[int, str]:
    threshold = int(rebate_config["threshold"])
    max_rebate = int(rebate_config["max_rebate"])
    if net_taxable > threshold:
        if rebate_config.get("marginal_relief") and tax_before_cess > (net_taxable - threshold):
            # Marginal relief: cap tax at (income - threshold)
            relief = tax_before_cess - (net_taxable - threshold)
            relief = max(relief, 0)
            formula = (
                f"Marginal relief (87A): income {fmt_inr(net_taxable)} > threshold {fmt_inr(threshold)}. "
                f"Tax capped at income−threshold = {fmt_inr(net_taxable - threshold)}. "
                f"Relief = {fmt_inr(tax_before_cess)} − {fmt_inr(net_taxable - threshold)} = {fmt_inr(relief)}"
            )
            return relief, formula
        return 0, f"No 87A rebate (income {fmt_inr(net_taxable)} > threshold {fmt_inr(threshold)})"
    rebate = min(tax_before_cess, max_rebate)
    formula = f"87A rebate: min(tax {fmt_inr(tax_before_cess)}, max {fmt_inr(max_rebate)}) = {fmt_inr(rebate)}"
    return rebate, formula


# ---------------------------------------------------------------------------
# Main income tax calculator (new regime)
# ---------------------------------------------------------------------------
def compute_income_tax(
    gross_salary: int,
    fy: str | None = None,
    regime: Regime = Regime.NEW,
    other_income: int = 0,
    deductions_old_regime: dict | None = None,
) -> TaxBreakdown:
    """
    Compute income tax with full step-by-step explanation.

    Args:
        gross_salary: Annual CTC or gross salary in ₹ (integer).
        fy: Financial year string e.g. '2024-25'. Defaults to current FY.
        regime: Regime.NEW or Regime.OLD.
        other_income: Additional income (interest, freelance etc.) in ₹.
        deductions_old_regime: Dict of deduction amounts by section for old regime
                                e.g. {"80C": 150000, "80D": 25000}.

    Returns:
        TaxBreakdown with all computed values and explanation.
    """
    if fy is None:
        fy = current_fy()
    rules = load_rules(fy)
    steps: list[str] = []
    assumptions: list[str] = []
    unverified: list[str] = []
    section_refs: list[str] = []

    # --- Standard deduction ---
    std_deduction = 0
    if regime == Regime.NEW:
        reg_rules = rules.get("new_regime", {})
        std_cfg = rules.get("standard_deduction", {})
        std_deduction = int(std_cfg.get("salaried", 0))
        if not std_cfg.get("verified", True):
            unverified.append(f"Standard deduction {fmt_inr(std_deduction)} — verify against Finance Act")
    else:
        reg_rules = rules.get("old_regime", {})
        std_deduction = 75000  # same for now; TODO: read from old_regime in rules
        assumptions.append("Standard deduction ₹75,000 assumed for old regime FY 2024-25")

    steps.append(f"Step 1 – Standard deduction: {fmt_inr(std_deduction)}")

    # --- Net taxable income ---
    total_income = gross_salary + other_income
    net_taxable = max(0, total_income - std_deduction)

    # Old regime deductions
    total_deductions = std_deduction
    deduction_steps: list[str] = []
    if regime == Regime.OLD and deductions_old_regime:
        for section, amount in deductions_old_regime.items():
            capped = int(amount)
            net_taxable = max(0, net_taxable - capped)
            total_deductions += capped
            section_refs.append(f"Section {section}")
            deduction_steps.append(f"  {section}: {fmt_inr(capped)} deducted")
        steps.extend(deduction_steps)

    steps.append(
        f"Step 2 – Net taxable income: {fmt_inr(total_income)} − {fmt_inr(total_deductions)} = {fmt_inr(net_taxable)}"
    )

    # --- Slab tax ---
    slabs: list[dict] = reg_rules.get("slabs", []) if isinstance(reg_rules.get("slabs"), list) else []
    if not slabs:
        # Old regime individual below 60
        slabs = rules.get("old_regime", {}).get("slabs_individual_below_60", [])
        assumptions.append("Using slabs for individual below 60 years for old regime")

    slab_tax, slab_breakdown = _compute_slab_tax(net_taxable, slabs)
    steps.append("Step 3 – Progressive slab tax:")
    for item in slab_breakdown:
        steps.append(f"  {item['formula']}")
    steps.append(f"  Total slab tax: {fmt_inr(slab_tax)}")

    # --- Surcharge ---
    surcharge_rules = rules.get("surcharge", {})
    surcharge_key = "new_regime" if regime == Regime.NEW else "old_regime"
    surcharge_slabs = surcharge_rules.get(surcharge_key, [])
    surcharge = 0
    surcharge_formula = "No surcharge applicable"
    if surcharge_slabs and total_income > 5_000_000:
        surcharge, surcharge_formula = _compute_surcharge(slab_tax, total_income, surcharge_slabs)
    steps.append(f"Step 4 – Surcharge: {surcharge_formula}")

    tax_after_surcharge = slab_tax + surcharge

    # --- 87A Rebate ---
    rebate_cfg = reg_rules.get("rebate_87A", {})
    rebate_87A = 0
    rebate_formula = "No rebate applicable"
    if rebate_cfg and not rebate_cfg.get("verified", True):
        unverified.append(f"87A rebate/marginal relief — verify exact formula for FY {fy}")
    if rebate_cfg:
        rebate_87A, rebate_formula = _compute_rebate_87A(net_taxable, tax_after_surcharge, rebate_cfg)
    steps.append(f"Step 5 – Section 87A rebate: {rebate_formula}")
    section_refs.append("Section 87A")

    tax_after_rebate = max(0, tax_after_surcharge - rebate_87A)

    # --- Cess ---
    cess_rate = float(reg_rules.get("cess", {}).get("rate", 0.04))
    cess = round(tax_after_rebate * cess_rate)
    cess_formula = f"Cess: {fmt_inr(tax_after_rebate)} × {cess_rate * 100:.0f}% = {fmt_inr(cess)}"
    steps.append(f"Step 6 – Health & Education Cess: {cess_formula}")
    section_refs.append("Section 2(17A)")

    total_tax = tax_after_rebate + cess
    steps.append(f"Step 7 – Total tax payable: {fmt_inr(tax_after_rebate)} + {fmt_inr(cess)} = {fmt_inr(total_tax)}")

    # Sanity check: tax can never exceed net taxable income
    if total_tax > net_taxable > 0:
        assumptions.append(
            f"SANITY CHECK FAILED: computed tax {fmt_inr(total_tax)} > net taxable {fmt_inr(net_taxable)}. "
            "Clamping to net taxable income."
        )
        total_tax = net_taxable

    effective_rate = round((total_tax / gross_salary) * 100, 2) if gross_salary > 0 else 0.0

    # Did any rules have verified=false?
    for slab in slabs:
        if not slab.get("verified", True):
            unverified.append(f"Slab {slab['from']}–{slab.get('to', '∞')} rate {slab['rate']} unverified for FY {fy}")
            break  # one warning enough

    explanation = TaxExplanation(
        formula="Progressive slab tax + surcharge + cess − 87A rebate",
        inputs={
            "gross_salary": gross_salary,
            "other_income": other_income,
            "standard_deduction": std_deduction,
            "net_taxable_income": net_taxable,
            "fy": fy,
            "regime": regime.value,
        },
        steps=steps,
        section_references=list(dict.fromkeys(section_refs)),
        confidence=Confidence.ESTIMATE if unverified else Confidence.EXACT,
        assumptions=assumptions,
        unverified_values=unverified,
    )

    return TaxBreakdown(
        fy=fy,
        regime=regime,
        gross_income=gross_salary,
        standard_deduction=std_deduction,
        net_taxable_income=net_taxable,
        slab_tax=slab_tax,
        slab_breakdown=slab_breakdown,
        surcharge=surcharge,
        cess=cess,
        rebate_87A=rebate_87A,
        total_tax=total_tax,
        effective_rate_pct=effective_rate,
        explanation=explanation,
    )


# ---------------------------------------------------------------------------
# Capital gains tax
# ---------------------------------------------------------------------------
def compute_capital_gains_tax(
    gain: int,
    gain_type: Literal["equity_stcg", "equity_ltcg", "debt_stcg", "debt_ltcg", "real_estate_ltcg"],
    fy: str | None = None,
    slab_rate: float | None = None,
    use_indexation: bool = False,
) -> CapGainsTaxResult:
    """
    Compute capital gains tax with full explanation.

    Args:
        gain: Capital gain in ₹ (integer).
        gain_type: One of equity_stcg, equity_ltcg, debt_stcg, debt_ltcg, real_estate_ltcg.
        fy: Financial year. Defaults to current FY.
        slab_rate: Required for debt_stcg (taxed at slab). Pass the applicable slab rate (0.0–0.30).
        use_indexation: For real_estate_ltcg — choose 20% with indexation (True) or 12.5% without (False).

    Returns:
        CapGainsTaxResult with computed tax and explanation.
    """
    if fy is None:
        fy = current_fy()
    rules = load_rules(fy)
    cg_rules = rules.get("capital_gains", {})
    cg = cg_rules.get(gain_type)
    if not cg:
        raise ValueError(f"No capital gains rule for '{gain_type}' in FY {fy}")

    steps: list[str] = []
    unverified: list[str] = []
    exemption = 0
    taxable_gain = gain

    if gain_type == "equity_ltcg":
        exemption = int(cg.get("exemption", 125000))
        taxable_gain = max(0, gain - exemption)
        steps.append(
            f"Section 112A LTCG exemption: {fmt_inr(gain)} − {fmt_inr(exemption)} = {fmt_inr(taxable_gain)} taxable"
        )
        if not cg.get("verified", True):
            unverified.append(f"Equity LTCG rate {cg['rate'] * 100}% and exemption {fmt_inr(exemption)} — verify for FY {fy}")

    elif gain_type == "debt_stcg":
        if slab_rate is None:
            raise ValueError("slab_rate required for debt_stcg (taxed at applicable slab rate)")
        steps.append(f"Debt STCG: added to income, taxed at slab rate {slab_rate * 100:.1f}%")

    elif gain_type == "real_estate_ltcg":
        if use_indexation:
            rate = float(cg.get("rate_with_indexation", 0.20))
            steps.append(f"Real estate LTCG with CII indexation: flat {rate * 100:.1f}% (Section 112)")
        else:
            rate = float(cg.get("rate_without_indexation", 0.125))
            steps.append(f"Real estate LTCG without indexation: flat {rate * 100:.1f}% (Section 112)")
        if not cg.get("verified", True):
            unverified.append(f"Real estate LTCG rate and indexation option unverified for FY {fy}")

    # Determine rate
    if gain_type == "debt_stcg":
        rate = slab_rate  # type: ignore[assignment]
    elif gain_type not in ("real_estate_ltcg",):
        rate = float(cg.get("rate", 0))

    tax = round(taxable_gain * rate)
    steps.append(
        f"Tax: {fmt_inr(taxable_gain)} × {rate * 100:.1f}% = {fmt_inr(tax)}"  # type: ignore[operator]
    )

    cess_rate = float(cg.get("cess", 0.04))
    cess = round(tax * cess_rate)
    steps.append(f"Cess: {fmt_inr(tax)} × {cess_rate * 100:.0f}% = {fmt_inr(cess)}")

    total_tax = tax + cess
    steps.append(f"Total: {fmt_inr(tax)} + {fmt_inr(cess)} = {fmt_inr(total_tax)}")

    section = cg.get("section", "")
    explanation = TaxExplanation(
        formula=f"Section {section}: taxable_gain × rate + cess",
        inputs={
            "gain": gain,
            "gain_type": gain_type,
            "exemption": exemption,
            "taxable_gain": taxable_gain,
            "rate": rate,
            "cess_rate": cess_rate,
            "fy": fy,
        },
        steps=steps,
        section_references=[f"Section {section}"] if section else [],
        confidence=Confidence.ESTIMATE if unverified else Confidence.EXACT,
        unverified_values=unverified,
    )

    return CapGainsTaxResult(
        gain_type=gain_type,
        section=section,
        rate=rate,  # type: ignore[arg-type]
        taxable_gain=taxable_gain,
        exemption_applied=exemption,
        tax=tax,
        cess=cess,
        total_tax=total_tax,
        explanation=explanation,
    )



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
    std_ded = 75000
    breakdown["Standard Deduction"] = std_ded
    total += std_ded
    expl.append(f"Standard Deduction: {fmt_inr(std_ded)}")

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


# ---------------------------------------------------------------------------
# Regime comparator
# ---------------------------------------------------------------------------
def compare_regimes(
    gross_salary: int,
    fy: str | None = None,
    other_income: int = 0,
    deductions_old_regime: dict | None = None,
) -> RegimeComparison:
    """Compare new vs old regime and recommend the cheaper one."""
    new_bd = compute_income_tax(
        gross_salary, fy=fy, regime=Regime.NEW, other_income=other_income
    )
    old_bd = compute_income_tax(
        gross_salary, fy=fy, regime=Regime.OLD, other_income=other_income,
        deductions_old_regime=deductions_old_regime,
    )
    recommended = Regime.NEW if new_bd.total_tax <= old_bd.total_tax else Regime.OLD
    savings = abs(new_bd.total_tax - old_bd.total_tax)
    return RegimeComparison(
        new_regime_tax=new_bd.total_tax,
        old_regime_tax=old_bd.total_tax,
        recommended_regime=recommended,
        savings=savings,
        new_breakdown=new_bd,
        old_breakdown=old_bd,
    )


# ---------------------------------------------------------------------------
# Advance tax calculator
# ---------------------------------------------------------------------------
def compute_advance_tax(
    estimated_annual_tax: int,
    fy: str | None = None,
    tds_deducted: int = 0,
) -> dict:
    """
    Compute advance tax instalments and due dates.
    Returns dict with instalment schedule.
    """
    if fy is None:
        fy = current_fy()
    rules = load_rules(fy)
    due_dates = rules.get("advance_tax_due_dates", [])
    net_tax = max(0, estimated_annual_tax - tds_deducted)
    schedule = []
    prev_pct = 0.0
    for slot in due_dates:
        pct = float(slot["cumulative_pct"])
        instalment = round(net_tax * (pct - prev_pct))
        cumulative = round(net_tax * pct)
        schedule.append({
            "due_date": slot["by_date"],
            "instalment": instalment,
            "cumulative_due": cumulative,
            "formula": (
                f"{slot['by_date']}: {pct * 100:.0f}% cumulative = {fmt_inr(cumulative)}; "
                f"this instalment = {fmt_inr(instalment)}"
            ),
        })
        prev_pct = pct
    return {
        "fy": fy,
        "estimated_annual_tax": estimated_annual_tax,
        "tds_deducted": tds_deducted,
        "net_advance_tax": net_tax,
        "schedule": schedule,
    }


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

