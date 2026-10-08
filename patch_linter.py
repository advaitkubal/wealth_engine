with open("backend/app/api/wealth.py", "r") as f:
    content = f.read()

# Move the import to top
content = content.replace("from app.intelligence.halo_score import compute_halo_score\n", "")
content = "from app.intelligence.halo_score import compute_halo_score\n" + content

with open("backend/app/api/wealth.py", "w") as f:
    f.write(content)

with open("backend/app/intelligence/debt_strategy.py", "r") as f:
    content = f.read()
content = content.replace("[l[\"name\"] for l in sorted_loans]", "[loan[\"name\"] for loan in sorted_loans]")
with open("backend/app/intelligence/debt_strategy.py", "w") as f:
    f.write(content)

with open("backend/app/parsers/bank_parser.py", "r") as f:
    content = f.read()
content = content.replace("if \"salary\" in desc: return \"salary\"", "if \"salary\" in desc:\n        return \"salary\"")
content = content.replace("if \"rent\" in desc: return \"rent\"", "if \"rent\" in desc:\n        return \"rent\"")
content = content.replace("if \"emi\" in desc: return \"EMI\"", "if \"emi\" in desc:\n        return \"EMI\"")
content = content.replace("if \"grocery\" in desc: return \"grocery\"", "if \"grocery\" in desc:\n        return \"grocery\"")
content = content.replace("if \"hospital\" in desc or \"medical\" in desc: return \"medical\"", "if \"hospital\" in desc or \"medical\" in desc:\n        return \"medical\"")
with open("backend/app/parsers/bank_parser.py", "w") as f:
    f.write(content)

with open("backend/app/tax_engine.py", "r") as f:
    content = f.read()
content = content.replace('limit_raw = deduction_cfg.get(section, {}).get("limit") if isinstance(deduction_cfg.get(section), dict) else None\n            capped = int(amount)', 'capped = int(amount)')
with open("backend/app/tax_engine.py", "w") as f:
    f.write(content)

with open("backend/app/intelligence/portfolio.py", "r") as f:
    content = f.read()
content = content.replace("list[tuple[any, float]]", "list[tuple[typing.Any, float]]")
content = "import typing\n" + content
with open("backend/app/intelligence/portfolio.py", "w") as f:
    f.write(content)

with open("backend/tests/test_tax_engine.py", "r") as f:
    content = f.read()
import_block = """from app.tax_engine import (
    OldRegimeInputs,
    compare_regimes_detailed,
    compute_hra_exemption,
    compute_old_regime_deductions,
    compute_section_234_interest,
)
"""
content = content.replace(import_block, "")
content = import_block + "\n" + content
with open("backend/tests/test_tax_engine.py", "w") as f:
    f.write(content)

