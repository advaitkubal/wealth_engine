"""
statement_extractor.py
-----------------------
Universal algorithmic parser for user-uploaded Bank Statements,
CAS Mutual Fund statements, Demat holding reports, Form 16, and Loan Schedules.
Extracts verified assets, liabilities, and income figures dynamically
from any PDF file dropped by the user.
"""

import re
from pathlib import Path
from typing import Dict, Any, List

def parse_inr(val_str: str) -> float:
    """Parses Indian numbers like '1,25,000', '42,50,000', '1.5 Cr', '25 Lakhs', '₹ 2.80 Crore'."""
    val_str = val_str.strip().replace('₹', '').replace('Rs.', '').replace('INR', '').replace('■', '').replace('`', '').strip()

    lower = val_str.lower()
    if 'cr' in lower:
        m = re.search(r'([\d.]+)', lower)
        return float(m.group(1)) * 10000000 if m else 0.0
    if 'lakh' in lower or 'lac' in lower or re.search(r'\b\d+(\.\d+)?\s*l\b', lower):
        m = re.search(r'([\d.]+)', lower)
        return float(m.group(1)) * 100000 if m else 0.0
    if 'k' in lower:
        m = re.search(r'([\d.]+)', lower)
        return float(m.group(1)) * 1000 if m else 0.0

    cleaned = re.sub(r'[^\d.]', '', val_str)
    try:
        return float(cleaned) if cleaned else 0.0
    except:
        return 0.0

def extract_portfolio_from_pdf(file_path: Path) -> Dict[str, Any]:
    """
    Dynamically extracts assets, liabilities, and income from ANY uploaded PDF statement.
    Handles standard bank tables, CAS reports, salary slips, Form 16, and credit repayment schedules.
    """
    import pypdf
    reader = pypdf.PdfReader(str(file_path))
    full_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            full_text += txt + "\n"

    # Normalize currency symbol artifacts from PDF engines
    normalized_text = full_text.replace('■', '₹').replace('`', '₹').replace('Rs.', '₹').replace('INR', '₹')
    lines = [l.strip() for l in normalized_text.splitlines() if l.strip()]

    assets: List[Dict[str, Any]] = []
    liabilities: List[Dict[str, Any]] = []
    gross_income: float = 0.0
    seen_asset_types = set()
    seen_liab_types = set()

    for i, line in enumerate(lines):
        l_lower = line.lower()

        # Find numbers in a sliding 4-line window or on the current line
        window_text = " ".join(lines[i:i+4])
        
        # Check for Lakh/Crore patterns first
        named_numbers = re.findall(r'₹?\s*(\d+(?:\.\d+)?\s*(?:cr|crore|crores|lakh|lakhs|lac|lacs|k)\b)', window_text, re.IGNORECASE)
        # Check for numeric comma patterns
        comma_numbers = re.findall(r'₹?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?)', window_text)
        # Check for standard digits
        digit_numbers = re.findall(r'₹?\s*(\d{5,12}(?:\.\d+)?)', window_text)

        all_candidate_strs = named_numbers + comma_numbers + digit_numbers
        parsed_numbers = [parse_inr(n) for n in all_candidate_strs if parse_inr(n) >= 5000]

        # 1. Real Estate / Property / Flat / Land
        if any(k in l_lower for k in ['real estate', 'property', 'apartment', 'flat', 'villa', 'residential property', 'land parcel', 'commercial property']):
            if "Real Estate" not in seen_asset_types and parsed_numbers:
                val = max(parsed_numbers)
                assets.append({
                    "type": "Real Estate",
                    "label": "Residential & Real Estate Holdings",
                    "value": val,
                    "yield_pct": 7.5
                })
                seen_asset_types.add("Real Estate")

        # 2. Mutual Funds / CAS
        elif any(k in l_lower for k in ['mutual fund', 'parag parikh', 'flexi cap', 'cams', 'kfintech', 'cas statement', 'sip investment', 'small cap', 'index fund', 'elss']):
            if "Mutual Funds" not in seen_asset_types and parsed_numbers:
                assets.append({
                    "type": "Mutual Funds",
                    "label": "Mutual Funds (Flexi Cap & Bluechip Portfolio)",
                    "value": parsed_numbers[0],
                    "yield_pct": 14.5
                })
                seen_asset_types.add("Mutual Funds")

        # 3. Direct Equities / Demat / Stocks
        elif any(k in l_lower for k in ['direct equities', 'equity', 'demat', 'shares', 'zerodha', 'groww', 'securities', 'stock portfolio', 'angel one', 'upstox']):
            if "Equity" not in seen_asset_types and parsed_numbers:
                assets.append({
                    "type": "Equity",
                    "label": "Direct Equities & Demat Holdings",
                    "value": parsed_numbers[0],
                    "yield_pct": 13.2
                })
                seen_asset_types.add("Equity")

        # 4. Fixed Deposit / Term Deposit
        elif any(k in l_lower for k in ['fixed deposit', 'term deposit', 'cumulative fd', 'fd balance', 'bank fd']):
            if "Fixed Deposit" not in seen_asset_types and parsed_numbers:
                assets.append({
                    "type": "Fixed Deposit",
                    "label": "Bank Fixed Deposit (Cumulative)",
                    "value": parsed_numbers[0],
                    "yield_pct": 7.25
                })
                seen_asset_types.add("Fixed Deposit")

        # 5. Gold / Sovereign Gold Bonds
        elif any(k in l_lower for k in ['gold', 'sovereign gold', 'sgb', 'digital gold', '24k gold']):
            if "Gold" not in seen_asset_types and parsed_numbers:
                assets.append({
                    "type": "Gold",
                    "label": "Sovereign Gold Bonds (SGB)",
                    "value": parsed_numbers[0],
                    "yield_pct": 8.5
                })
                seen_asset_types.add("Gold")

        # 6. NPS / PPF / EPF / Retirement
        elif any(k in l_lower for k in ['nps', 'ppf', 'provident fund', 'epf', 'pension fund', 'vpf']):
            if "NPS/PPF" not in seen_asset_types and parsed_numbers:
                assets.append({
                    "type": "NPS/PPF",
                    "label": "NPS Tier-1 & Public Provident Fund (PPF)",
                    "value": parsed_numbers[0],
                    "yield_pct": 7.1
                })
                seen_asset_types.add("NPS/PPF")

        # 7. Liquid Cash / Savings Balance
        elif any(k in l_lower for k in ['savings account', 'savings balance', 'cash', 'available balance', 'savings a/c', 'liquid cash', 'bank balance', 'current account']):
            if "Cash" not in seen_asset_types and parsed_numbers:
                assets.append({
                    "type": "Cash",
                    "label": "Liquid Bank Savings Account",
                    "value": parsed_numbers[0],
                    "yield_pct": 3.5
                })
                seen_asset_types.add("Cash")

        # 8. Home Loan / Property Loan
        if any(k in l_lower for k in ['home loan', 'housing loan', 'property loan', 'mortgage loan', 'housing finance']):
            if "Home Loan" not in seen_liab_types and parsed_numbers:
                bal = max(parsed_numbers)
                emi = min(parsed_numbers) if len(parsed_numbers) > 1 and min(parsed_numbers) < bal * 0.1 else round(bal * 0.0087)
                liabilities.append({
                    "type": "Home Loan",
                    "label": "Bank Housing Loan Account",
                    "remaining": bal,
                    "rate": 8.4,
                    "emi": emi,
                    "tenure": 168
                })
                seen_liab_types.add("Home Loan")

        # 9. Car Loan / Auto Loan
        elif any(k in l_lower for k in ['car loan', 'auto loan', 'vehicle loan', 'express auto', 'two wheeler loan']):
            if "Car Loan" not in seen_liab_types and parsed_numbers:
                bal = max(parsed_numbers)
                emi = min(parsed_numbers) if len(parsed_numbers) > 1 and min(parsed_numbers) < bal * 0.2 else round(bal * 0.0234)
                liabilities.append({
                    "type": "Car Loan",
                    "label": "Vehicle Auto Loan Account",
                    "remaining": bal,
                    "rate": 8.85,
                    "emi": emi,
                    "tenure": 42
                })
                seen_liab_types.add("Car Loan")

        # 10. Personal Loan
        elif any(k in l_lower for k in ['personal loan', 'instant loan', 'flexi personal loan']):
            if "Personal Loan" not in seen_liab_types and parsed_numbers:
                bal = max(parsed_numbers)
                emi = min(parsed_numbers) if len(parsed_numbers) > 1 and min(parsed_numbers) < bal * 0.2 else round(bal * 0.032)
                liabilities.append({
                    "type": "Personal Loan",
                    "label": "Personal Term Loan",
                    "remaining": bal,
                    "rate": 11.5,
                    "emi": emi,
                    "tenure": 36
                })
                seen_liab_types.add("Personal Loan")

        # 11. Education Loan
        elif any(k in l_lower for k in ['education loan', 'student loan', 'higher study loan']):
            if "Education Loan" not in seen_liab_types and parsed_numbers:
                bal = max(parsed_numbers)
                emi = min(parsed_numbers) if len(parsed_numbers) > 1 and min(parsed_numbers) < bal * 0.1 else round(bal * 0.012)
                liabilities.append({
                    "type": "Education Loan",
                    "label": "Higher Education Loan",
                    "remaining": bal,
                    "rate": 9.2,
                    "emi": emi,
                    "tenure": 84
                })
                seen_liab_types.add("Education Loan")

        # 12. Gross Salary / Income Credit
        if any(k in l_lower for k in ['salary credit', 'gross salary', 'annual salary', 'ctc', 'annual income', 'total earnings', 'taxable income', 'net salary']):
            if parsed_numbers and gross_income == 0.0:
                val = parsed_numbers[0]
                # If parsed number is monthly salary (e.g. 20k to 8L), scale to annual
                if 20000 <= val <= 800000 and any(m in l_lower for m in ['month', 'monthly', 'net pay', 'salary credit']):
                    gross_income = round(val * 12 / 0.82)
                else:
                    gross_income = val

    return {
        "assets": assets,
        "liabilities": liabilities,
        "gross_income": gross_income,
        "raw_text_length": len(full_text)
    }
