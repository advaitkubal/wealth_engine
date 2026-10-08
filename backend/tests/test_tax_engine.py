from app.tax_engine import (  # noqa: E402
    OldRegimeInputs,
    compare_regimes_detailed,
    compute_hra_exemption,
    compute_old_regime_deductions,
    compute_section_234_interest,
)

"""
Tests: tax_engine.py — rules-driven Indian income tax calculations.
All values tested against incometax.gov.in utility and Finance Act 2024.
"""
import json  # noqa: E402
import sys  # noqa: E402
from pathlib import Path  # noqa: E402

import pytest  # noqa: E402

# Ensure backend/app is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.tax_engine import (  # noqa: E402
    Regime,
    RegimeComparison,
    compare_regimes,
    compute_advance_tax,
    compute_capital_gains_tax,
    compute_income_tax,
    fmt_inr,
    load_rules,
)

# ---------------------------------------------------------------------------
# Load golden fixtures
# ---------------------------------------------------------------------------
FIXTURES_PATH = Path(__file__).parent / "fixtures" / "tax_golden.json"
GOLDEN = json.loads(FIXTURES_PATH.read_text())


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _get_fixture(fid: str) -> dict:
    for f in GOLDEN:
        if f.get("id") == fid:
            return f
    raise KeyError(f"Fixture '{fid}' not found in tax_golden.json")


# ---------------------------------------------------------------------------
# Formatter tests
# ---------------------------------------------------------------------------
class TestFmtInr:
    def test_small(self):
        assert fmt_inr(1000) == "₹1,000"

    def test_lakh(self):
        assert fmt_inr(100000) == "₹1,00,000"

    def test_crore(self):
        assert fmt_inr(10000000) == "₹1,00,00,000"

    def test_negative(self):
        assert fmt_inr(-50000) == "-₹50,000"

    def test_zero(self):
        assert fmt_inr(0) == "₹0"

    def test_round_float(self):
        assert fmt_inr(12500.7) == "₹12,501"


# ---------------------------------------------------------------------------
# Rules loader tests
# ---------------------------------------------------------------------------
class TestRulesLoader:
    def test_load_fy_2024_25(self):
        rules = load_rules("2024-25")
        assert rules["fy"] == "2024-25"
        assert "new_regime" in rules
        assert "capital_gains" in rules

    def test_load_fy_2025_26(self):
        rules = load_rules("2025-26")
        assert rules["fy"] == "2025-26"

    def test_invalid_fy_raises(self):
        with pytest.raises(FileNotFoundError, match="No rules file for FY"):
            load_rules("1999-00")

    def test_fy_normalisation(self):
        # Different input formats should all resolve to same file
        r1 = load_rules("2024-25")
        r2 = load_rules("FY 2024-25")
        r3 = load_rules("2024_25")
        assert r1["fy"] == r2["fy"] == r3["fy"]

    def test_new_regime_slabs_non_empty(self):
        rules = load_rules("2024-25")
        slabs = rules["new_regime"]["slabs"]
        assert len(slabs) >= 7, "New regime must have at least 7 slabs"
        assert slabs[0]["from"] == 0
        assert slabs[0]["rate"] == 0.0
        # Last slab has no upper bound
        assert slabs[-1]["to"] is None


# ---------------------------------------------------------------------------
# Income tax: zero income
# ---------------------------------------------------------------------------
class TestZeroIncome:
    def test_zero_salary(self):
        bd = compute_income_tax(0, fy="2024-25")
        assert bd.total_tax == 0
        assert bd.net_taxable_income == 0
        assert bd.effective_rate_pct == 0.0

    def test_very_small_income_below_std_deduction(self):
        # ₹50,000 gross — std deduction ₹75,000 → net = 0
        bd = compute_income_tax(50000, fy="2024-25")
        assert bd.net_taxable_income == 0
        assert bd.total_tax == 0


# ---------------------------------------------------------------------------
# Income tax: new regime standard cases
# ---------------------------------------------------------------------------
class TestNewRegimeSlabs:
    """Test progressive slab logic slice by slice."""

    def test_6L_zero_tax(self):
        """₹6L gross — net ₹5.25L — slab tax ₹6,250 — 87A rebate removes it all."""
        f = _get_fixture("NR_6L_ZERO_TAX")
        bd = compute_income_tax(f["gross_salary"], fy=f["fy"], regime=Regime.NEW)
        assert bd.standard_deduction == f["expected"]["standard_deduction"]
        assert bd.net_taxable_income == f["expected"]["net_taxable_income"]
        assert bd.slab_tax == f["expected"]["slab_tax"]
        assert bd.rebate_87A == f["expected"]["rebate_87A"]
        assert bd.total_tax == 0

    def test_7L_net_exact_threshold_zero_tax(self):
        """₹7.75L gross → net ₹7L exactly → 87A rebate covers all tax."""
        f = _get_fixture("NR_7L_EXACT_THRESHOLD")
        bd = compute_income_tax(f["gross_salary"], fy=f["fy"], regime=Regime.NEW)
        assert bd.net_taxable_income == 700000
        assert bd.total_tax == 0, "Income exactly at ₹7L should have zero tax via 87A"

    def test_10L_gross_standard(self):
        """₹10L gross → net ₹9.25L → slice-by-slice tax."""
        f = _get_fixture("NR_10L_STANDARD")
        bd = compute_income_tax(f["gross_salary"], fy=f["fy"], regime=Regime.NEW)
        exp = f["expected"]
        assert bd.net_taxable_income == exp["net_taxable_income"]
        assert bd.slab_tax == exp["slab_tax"]
        assert bd.cess == exp["cess"]
        assert bd.total_tax == exp["total_tax"]

    def test_slab_tax_never_exceeds_income(self):
        """Sanity: total tax ≤ gross salary for any reasonable income."""
        for income in [0, 100000, 500000, 1200000, 5000000]:
            bd = compute_income_tax(income, fy="2024-25")
            assert bd.total_tax <= max(income, 1), (
                f"Tax {bd.total_tax} > income {income} for ₹{income:,}"
            )

    def test_slab_monotonic(self):
        """Higher income should never result in lower total tax."""
        prev_tax = -1
        for income in [0, 400000, 700000, 800000, 1000000, 1500000, 2500000]:
            bd = compute_income_tax(income, fy="2024-25", regime=Regime.NEW)
            assert bd.total_tax >= prev_tax, (
                f"Tax not monotonic: {income} gives ₹{bd.total_tax} < previous ₹{prev_tax}"
            )
            prev_tax = bd.total_tax

    def test_15L_standard_regime(self):
        """₹15L gross — check all slabs fire correctly."""
        bd = compute_income_tax(1500000, fy="2024-25", regime=Regime.NEW)
        assert bd.standard_deduction == 75000
        assert bd.net_taxable_income == 1425000
        # Slab breakdown: 0-4L=0, 4L-8L=20000, 8L-12L=40000, 12L-14.25L=33750
        assert bd.slab_tax == 93750, f"Expected 93750, got {bd.slab_tax}"
        assert bd.cess == round(93750 * 0.04)
        assert bd.total_tax == 93750 + round(93750 * 0.04)

    def test_explanation_has_steps(self):
        bd = compute_income_tax(1000000, fy="2024-25")
        assert len(bd.explanation.steps) >= 5, "Explanation must have at least 5 steps"

    def test_explanation_has_formula_inputs(self):
        bd = compute_income_tax(800000, fy="2024-25")
        assert bd.explanation.formula
        assert bd.explanation.inputs.get("gross_salary") == 800000
        assert bd.explanation.inputs.get("fy") == "2024-25"


# ---------------------------------------------------------------------------
# Income tax: 87A marginal relief
# ---------------------------------------------------------------------------
class TestMarginalRelief:
    def test_above_threshold_gets_marginal_relief(self):
        """₹7.1L net taxable — marginal relief kicks in."""
        bd = compute_income_tax(785000, fy="2024-25", regime=Regime.NEW)
        # net = 785000 - 75000 = 710000
        assert bd.net_taxable_income == 710000
        # With marginal relief: tax_after_rebate = 710000 - 700000 = 10000
        assert bd.total_tax <= 10400, (
            f"With marginal relief, total tax should be ≤₹10,400 not {bd.total_tax}"
        )
        assert bd.rebate_87A > 0, "Marginal relief should produce non-zero rebate"

    def test_well_above_threshold_no_marginal_relief(self):
        """₹9L net — well above threshold, no rebate at all."""
        bd = compute_income_tax(975000, fy="2024-25", regime=Regime.NEW)
        assert bd.net_taxable_income == 900000
        assert bd.rebate_87A == 0


# ---------------------------------------------------------------------------
# Capital gains
# ---------------------------------------------------------------------------
class TestCapitalGains:
    def test_equity_stcg_111A(self):
        """Equity STCG: flat 20% + 4% cess."""
        f = _get_fixture("CAP_GAINS_EQUITY_STCG_2L")
        result = compute_capital_gains_tax(
            gain=f["gain"], gain_type="equity_stcg", fy=f["fy"]
        )
        exp = f["expected"]
        assert result.taxable_gain == exp["taxable_gain"]
        assert result.tax == exp["tax"], f"200000 * 0.20 should = 40000, got {result.tax}"
        assert result.cess == exp["cess"]
        assert result.total_tax == exp["total_tax"]
        assert result.section == "111A"

    def test_equity_ltcg_112A_with_exemption(self):
        """Equity LTCG: ₹1.25L exempt, 12.5% on remainder."""
        f = _get_fixture("CAP_GAINS_EQUITY_LTCG_3L")
        result = compute_capital_gains_tax(
            gain=f["gain"], gain_type="equity_ltcg", fy=f["fy"]
        )
        exp = f["expected"]
        assert result.exemption_applied == exp["exemption_applied"]
        assert result.taxable_gain == exp["taxable_gain"]
        assert result.tax == exp["tax"], f"175000 * 0.125 should = 21875, got {result.tax}"
        assert result.cess == exp["cess"]
        assert result.total_tax == exp["total_tax"]

    def test_equity_ltcg_below_exemption_zero_tax(self):
        """LTCG < ₹1.25L — zero tax."""
        result = compute_capital_gains_tax(gain=100000, gain_type="equity_ltcg", fy="2024-25")
        assert result.taxable_gain == 0
        assert result.total_tax == 0

    def test_debt_stcg_requires_slab_rate(self):
        """Debt STCG must require slab_rate argument."""
        with pytest.raises(ValueError, match="slab_rate required"):
            compute_capital_gains_tax(gain=100000, gain_type="debt_stcg", fy="2024-25")

    def test_debt_stcg_at_slab_rate(self):
        """Debt STCG at 20% slab rate."""
        result = compute_capital_gains_tax(
            gain=200000, gain_type="debt_stcg", fy="2024-25", slab_rate=0.20
        )
        assert result.tax == 40000  # 200000 * 0.20
        assert result.cess == 1600
        assert result.total_tax == 41600

    def test_zero_gain(self):
        """Zero gain → zero tax for all types."""
        for gtype in ["equity_stcg", "equity_ltcg"]:
            result = compute_capital_gains_tax(gain=0, gain_type=gtype, fy="2024-25")
            assert result.total_tax == 0

    def test_invalid_gain_type(self):
        """Invalid gain type should raise ValueError."""
        with pytest.raises(ValueError):
            compute_capital_gains_tax(gain=100000, gain_type="unknown_type", fy="2024-25")  # type: ignore


# ---------------------------------------------------------------------------
# Regime comparator
# ---------------------------------------------------------------------------
class TestRegimeComparator:
    def test_returns_regime_comparison(self):
        cmp = compare_regimes(1000000, fy="2024-25")
        assert isinstance(cmp, RegimeComparison)
        assert cmp.recommended_regime in (Regime.NEW, Regime.OLD)
        assert cmp.savings >= 0

    def test_recommended_has_lower_tax(self):
        cmp = compare_regimes(1200000, fy="2024-25")
        if cmp.recommended_regime == Regime.NEW:
            assert cmp.new_regime_tax <= cmp.old_regime_tax
        else:
            assert cmp.old_regime_tax <= cmp.new_regime_tax

    def test_savings_is_difference(self):
        cmp = compare_regimes(1500000, fy="2024-25")
        assert cmp.savings == abs(cmp.new_regime_tax - cmp.old_regime_tax)


# ---------------------------------------------------------------------------
# Advance tax
# ---------------------------------------------------------------------------
class TestAdvanceTax:
    def test_four_instalments(self):
        result = compute_advance_tax(100000, fy="2024-25", tds_deducted=0)
        assert len(result["schedule"]) == 4

    def test_cumulative_equals_net_tax(self):
        result = compute_advance_tax(100000, fy="2024-25", tds_deducted=20000)
        assert result["net_advance_tax"] == 80000
        total_instalments = sum(s["instalment"] for s in result["schedule"])
        # Allow ₹4 rounding tolerance
        assert abs(total_instalments - 80000) <= 4

    def test_tds_reduces_advance_tax(self):
        r1 = compute_advance_tax(100000, fy="2024-25", tds_deducted=0)
        r2 = compute_advance_tax(100000, fy="2024-25", tds_deducted=50000)
        assert r2["net_advance_tax"] == 50000
        assert r2["net_advance_tax"] < r1["net_advance_tax"]


# ---------------------------------------------------------------------------
# Currency formatter / parse smoke tests
# ---------------------------------------------------------------------------
class TestParseIndianCurrency:
    """Test parse_indian_currency from wealth_tools."""
    def test_parse_lakh(self):
        from app.rag.wealth_tools import parse_indian_currency
        assert parse_indian_currency("5 lakhs") == 500000

    def test_parse_crore(self):
        from app.rag.wealth_tools import parse_indian_currency
        assert parse_indian_currency("1.5 cr") == 15000000

    def test_parse_k(self):
        from app.rag.wealth_tools import parse_indian_currency
        assert parse_indian_currency("35.5k") == 35500

    def test_parse_plain_number(self):
        from app.rag.wealth_tools import parse_indian_currency
        assert parse_indian_currency("1000000") == 1000000

    def test_parse_inr_symbol(self):
        from app.rag.wealth_tools import parse_indian_currency
        assert parse_indian_currency("₹75000") == 75000


# ---------------------------------------------------------------------------
# Network isolation sanity
# ---------------------------------------------------------------------------
class TestNetworkBlocked:
    def test_socket_blocked(self):
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        with pytest.raises(ConnectionRefusedError, match="HALO TEST ISOLATION"):
            sock.connect(("8.8.8.8", 80))




class TestOldRegimeDeductions:
    def test_hra_exemption_metro(self):
        exemption, expl = compute_hra_exemption(
            basic_salary=1000000,
            hra_received=400000,
            rent_paid=300000,
            is_metro=True
        )
        assert exemption == 200000
        assert "50%" in expl

    def test_hra_exemption_non_metro(self):
        exemption, expl = compute_hra_exemption(
            basic_salary=1000000,
            hra_received=400000,
            rent_paid=300000,
            is_metro=False
        )
        assert exemption == 200000
        assert "40%" in expl

    def test_hra_exemption_no_rent(self):
        exemption, _ = compute_hra_exemption(1000000, 400000, 0, True)
        assert exemption == 0

    def test_old_regime_deductions(self):
        inputs = OldRegimeInputs(
            basic_salary=1000000,
            hra_received=400000,
            rent_paid=300000,
            is_metro=True,
            sec_80c=200000,
            sec_80ccd1b=60000,
            sec_80ccd2_employer_nps=200000,
            sec_80d_self_family=30000,
            sec_80d_parents=60000,
            sec_24b_home_loan_interest=250000,
            sec_80e_education_loan_interest=50000,
            sec_80eeb_ev_loan_interest=200000
        )
        res = compute_old_regime_deductions(inputs)
        assert res.breakdown["Standard Deduction"] == 75000
        assert res.breakdown["HRA"] == 200000
        assert res.breakdown["80C"] == 150000
        assert res.breakdown["80CCD(1B)"] == 50000
        assert res.breakdown["80CCD(2)"] == 140000
        assert res.breakdown["80D"] == 25000 + 25000
        assert res.breakdown["24(b)"] == 200000
        assert res.breakdown["80E"] == 50000
        assert res.breakdown["80EEB"] == 150000

        expected_total = 75000 + 200000 + 150000 + 50000 + 140000 + 50000 + 200000 + 50000 + 150000
        assert res.total_deduction == expected_total

    def test_compare_regimes_detailed(self):
        inputs = OldRegimeInputs(
            basic_salary=1000000,
            sec_80c=150000
        )
        res = compare_regimes_detailed(gross_salary=2000000, old_inputs=inputs, fy="2024-25")
        assert res.old_deductions.total_deduction == 225000
        assert res.recommended_regime in (Regime.NEW, Regime.OLD)

class TestSection234Interest:
    def test_section_234_interest_no_penalty(self):
        res = compute_section_234_interest(0, 0, {})
        assert res["interest_234B"] == 0
        assert res["interest_234C"] == 0

    def test_section_234c_penalty(self):
        res = compute_section_234_interest(100000, 0, {
            "2024-06-15": 0,
            "2024-09-15": 0,
            "2024-12-15": 0,
            "2025-03-15": 0
        }, fy="2024-25")
        assert res["interest_234C"] == 5050


class TestTaxComplianceSummary:
    def test_compliance_summary_2024_25(self):
        from app.api.tax import get_tax_compliance_summary
        summary = get_tax_compliance_summary(income=2400000, fy="2024-25")
        assert summary.annual_income == 2400000
        assert summary.new_regime_tax == 292500
        assert summary.standard_deduction == 75000
        assert summary.q1_due == int(round(292500 * 0.15))
        assert summary.q4_due == 292500
        assert summary.compliance_score_pct == 95
        assert len(summary.active_exemptions) >= 3

    def test_compliance_summary_edge_case_zero_income(self):
        from app.api.tax import get_tax_compliance_summary
        summary = get_tax_compliance_summary(income=0, fy="2024-25")
        assert summary.new_regime_tax == 0
        assert summary.q1_due == 0
        assert summary.effective_rate_pct == 0.0

