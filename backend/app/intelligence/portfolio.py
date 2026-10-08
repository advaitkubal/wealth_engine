import scipy.optimize

def compute_xirr(cashflows: list[tuple[any, float]]) -> float:
    # cashflows is a list of (date, amount)
    # This is a stub, scipy.optimize would be used
    return 0.12

def compute_cagr(start_value: float, end_value: float, years: float) -> float:
    if start_value <= 0 or years <= 0:
        return 0.0
    return (end_value / start_value) ** (1 / years) - 1

def regular_vs_direct_leakage(expense_ratio_regular: float, expense_ratio_direct: float, corpus: float, years: int) -> float:
    diff = expense_ratio_regular - expense_ratio_direct
    # Rough approximation
    return corpus * diff * years
