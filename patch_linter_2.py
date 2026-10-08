with open("backend/app/tax_engine.py", "r") as f:
    content = f.read()

content = content.replace("deduction_cfg = rules.get(\"old_regime\", {}).get(\"deductions\", {})\n        for section, amount in deductions_old_regime.items():", "for section, amount in deductions_old_regime.items():")

with open("backend/app/tax_engine.py", "w") as f:
    f.write(content)

with open("backend/tests/test_tax_engine.py", "r") as f:
    content = f.read()

lines = content.splitlines()
docstring_end = 0
for i, line in enumerate(lines):
    if line == '"""':
        docstring_end = i
        break

if docstring_end > 0:
    import_block = """from app.tax_engine import (
    OldRegimeInputs,
    compare_regimes_detailed,
    compute_hra_exemption,
    compute_old_regime_deductions,
    compute_section_234_interest,
)"""
    content = "\n".join(lines[:docstring_end+1]) + "\n" + "\n".join(lines[docstring_end+1:])
    # Wait, the issue is that sys.path.insert is before `from app.tax_engine`.
    # Ruff complains about module level import not at top of file, but sys.path.insert MUST be before it.
    # To fix this, we can just add `# noqa: E402` to those lines.

with open("backend/tests/test_tax_engine.py", "r") as f:
    lines = f.readlines()

out = []
for line in lines:
    if line.startswith("import json") or line.startswith("import sys") or line.startswith("from pathlib import Path") or line.startswith("import pytest") or line.startswith("from app.tax_engine import ("):
        out.append(line.rstrip() + "  # noqa: E402\n")
    else:
        out.append(line)

with open("backend/tests/test_tax_engine.py", "w") as f:
    f.writelines(out)
