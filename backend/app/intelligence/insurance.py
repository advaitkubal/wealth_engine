def compute_term_insurance_adequacy(annual_income: float, outstanding_loans: float, dependents: int, existing_cover: float) -> float:
    recommended = (annual_income * 10) + outstanding_loans
    if dependents > 0:
        recommended += 5000000 # 50L extra for dependents
    return max(0.0, recommended - existing_cover)

def compute_health_insurance_adequacy(age: int, city_tier: int, family_size: int, existing_cover: float) -> float:
    base = 1000000 if city_tier == 1 else 500000
    if family_size > 2:
        base += 500000
    if age > 50:
        base += 500000
    return max(0.0, base - existing_cover)
