import re

tests_to_add = """
from app.tax_engine import (
    OldRegimeInputs,
    compute_hra_exemption,
    compute_old_regime_deductions,
    compute_section_234_interest,
    compare_regimes_detailed,
    Regime
)

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
            "15 Jun": 0,
            "15 Sep": 0,
            "15 Dec": 0,
            "15 Mar": 0
        })
        assert res["interest_234C"] == 5050
"""
with open("backend/tests/test_tax_engine.py", "a") as f:
    f.write("\n" + tests_to_add)
