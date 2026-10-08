import re

text = """
HDFC Bank Account Statement
Balance: ₹1,45,000
Parag Parikh Flexi Cap Fund Value: ₹85,00,000
SBI Bluechip Fund: ₹12,50,000
Direct Equity Portfolio: ₹45,00,000
Gold Sovereign Bond: ₹8,00,000
Fixed Deposit with ICICI: ₹15,00,000
Home Loan Account: Outstanding Principal: ₹35,00,000, EMI: ₹32,000, Rate: 8.5%
Car Loan HDFC: Outstanding: ₹4,50,000, Rate: 9.0%, EMI: 12000
"""

def parse_currency(s):
    try:
        cleaned = re.sub(r'[^\d.]', '', s)
        return float(cleaned)
    except:
        return 0.0

print("Currency test:", parse_currency("₹1,45,000"))
