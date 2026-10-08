import re

# Fix tax_engine.py
with open("backend/app/tax_engine.py", "r") as f:
    content = f.read()

content = content.replace('''
    # Standard Deduction is handled in compute_income_tax directly
    
    # HRA''', '''
    # Standard Deduction is handled in compute_income_tax directly
    std_ded = 75000
    breakdown["Standard Deduction"] = std_ded
    total += std_ded
    expl.append(f"Standard Deduction: {fmt_inr(std_ded)}")
    
    # HRA''')

with open("backend/app/tax_engine.py", "w") as f:
    f.write(content)


# Fix tests
with open("backend/tests/test_tax_engine.py", "r") as f:
    t_content = f.read()

t_content = t_content.replace('''
        res = compute_section_234_interest(100000, 0, {
            "15 Jun": 0,
            "15 Sep": 0,
            "15 Dec": 0,
            "15 Mar": 0
        })
''', '''
        res = compute_section_234_interest(100000, 0, {
            "2024-06-15": 0,
            "2024-09-15": 0,
            "2024-12-15": 0,
            "2025-03-15": 0
        }, fy="2024-25")
''')

with open("backend/tests/test_tax_engine.py", "w") as f:
    f.write(t_content)
