"""
wealth_tools.py
---------------
Tool definitions and execution logic for the AI agent.
The LLM can call these tools to read/write the Wealth Engine database,
compute Indian tax liabilities, and analyze loan EMIs & interest rates.
"""

import datetime
import json
import logging
import re

from app.database import database
from app.tax_engine import (
    Regime,
    compute_capital_gains_tax,
    compute_income_tax,
    compute_side_income_tax,
    fmt_inr,
)

logger = logging.getLogger(__name__)

# ── Helper: Indian Currency & Denomination Parser ────────────────────────────

def parse_indian_currency(val) -> float:
    """
    Robustly parses Indian currency strings, floats, ints, and denomination units.
    Examples:
      - "5 cr", "5 crore", "5crores", "5.5 cr" -> 50,000,000.0 or 55,000,000.0
      - "8.9 lakhs", "8.9 lakh", "8.9 lac", "8.9l", "18 lakh" -> 890,000.0 or 1,800,000.0
      - "35.5k", "35.5 thousand", "35k" -> 35,500.0 or 35,000.0
      - "₹18,00,000", "5,00,000", "35500" -> 1,800,000.0, 500,000.0, 35,500.0
      - None or invalid -> 0.0
    """
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)

    s = str(val).strip().lower().replace("₹", "").replace("rs.", "").replace("rs", "").replace(",", "")

    # Check Crore / Cr
    m_cr = re.search(r"([\d\.]+)\s*(?:cr|crore|crores)\b", s)
    if m_cr:
        try:
            return float(m_cr.group(1)) * 10_000_000.0
        except ValueError:
            pass

    # Check Lakh / Lac / L
    m_lakh = re.search(r"([\d\.]+)\s*(?:lakh|lakhs|lac|lacs|l)\b", s)
    if m_lakh:
        try:
            return float(m_lakh.group(1)) * 100_000.0
        except ValueError:
            pass

    # Check Thousand / K
    m_k = re.search(r"([\d\.]+)\s*(?:k|thousand|thousands)\b", s)
    if m_k:
        try:
            return float(m_k.group(1)) * 1_000.0
        except ValueError:
            pass

    # Extract first numeric sequence
    m_num = re.search(r"[\d\.]+", s)
    if m_num:
        try:
            return float(m_num.group(0))
        except ValueError:
            pass

    return 0.0


# ── Tool schemas (OpenAI tool-calling format, compatible with Ollama) ────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_portfolio_summary",
            "description": (
                "Fetch the user's live portfolio from the Wealth Engine database. "
                "Returns net worth, total assets, total liabilities, and a full breakdown "
                "of every asset and liability. Call this FIRST whenever the user asks about "
                "their finances, current wealth, net worth, investments, loans, or wants "
                "personalized advice."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_asset",
            "description": (
                "Add a new asset to the user's Wealth Engine portfolio. "
                "Use this when the user says they bought something, deposited funds, have a new investment, "
                "or wants to record a new asset. Always pass the exact value string like '5 cr', '50 lakh', '2L'. "
                "Valid categories: Equity, Mutual Funds, Gold, Real Estate, NPS/PPF, Cash."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "type":      {"type": "string", "description": "Asset category. One of: Equity, Mutual Funds, Gold, Real Estate, NPS/PPF, Cash"},
                    "label":     {"type": "string", "description": "Friendly name, e.g. 'Cash Savings', 'Axis Bluechip Fund', 'Gold Jewelry'"},
                    "value":     {"type": "string", "description": "Monetary value. Pass string with unit directly from user, e.g. '5 cr', '50 lakh', '2L', '1800000'."},
                    "yield_pct": {"type": "number", "description": "Expected annual yield percentage. Default 0 if unknown."},
                },
                "required": ["label", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_liability",
            "description": (
                "Add a new liability (loan or debt) to the user's Wealth Engine portfolio. "
                "Use this when the user mentions they have taken a new loan or have a new debt. "
                "Valid categories: Home Loan, Car Loan, Personal Loan, Credit Card, Education Loan."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "type":      {"type": "string", "description": "Loan category. One of: Home Loan, Car Loan, Personal Loan, Credit Card, Education Loan"},
                    "label":     {"type": "string", "description": "Friendly name, e.g. 'ICICI Personal Loan' or 'SBI Home Loan'"},
                    "remaining": {"type": "string", "description": "Outstanding balance/principal. Pass string with unit, e.g. '8.9 lakhs', '28L', '450000'."},
                    "rate":      {"type": "number", "description": "Annual interest rate percentage (e.g. 25.24 for 25.24%, 8.5)"},
                    "emi":       {"type": "string", "description": "Monthly EMI amount, e.g. '35.5k' or '35500'"},
                    "tenure":    {"type": "integer", "description": "Remaining tenure in months"},
                },
                "required": ["remaining"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_asset",
            "description": "Remove an asset from the portfolio by its numeric ID. First call get_portfolio_summary to find the correct ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "asset_id": {"type": "integer", "description": "The numeric ID of the asset to delete"},
                },
                "required": ["asset_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_liability",
            "description": "Remove a liability from the portfolio by its numeric ID. First call get_portfolio_summary to find the correct ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "liab_id": {"type": "integer", "description": "The numeric ID of the liability to delete"},
                },
                "required": ["liab_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_liability",
            "description": (
                "Update an existing liability (e.g. modify remaining balance, interest rate, or monthly EMI of Home Loan, Car Loan, etc.). "
                "Use this whenever the user says 'change homeloan to 40 lakhs', 'update loan', 'modify home loan', "
                "'prepay 5 lakhs from loan', or similar. Can identify loan by liab_id OR by loan_name/loan_type."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "liab_id":   {"type": "integer", "description": "Optional numeric ID of the liability to update."},
                    "loan_name": {"type": "string", "description": "Name or category of loan to update, e.g. 'Home Loan', 'Car Loan', 'SBI Home Loan'."},
                    "remaining": {"type": "string", "description": "New remaining balance/principal, e.g. '40 lakhs', '25L', '1800000'."},
                    "rate":      {"type": "number", "description": "New annual interest rate percentage (e.g. 8.25, 9.5)."},
                    "emi":       {"type": "string", "description": "New monthly EMI amount, e.g. '32k' or '32000'."},
                    "tenure":    {"type": "integer", "description": "New remaining tenure in months."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_asset",
            "description": (
                "Update an existing asset (e.g. modify valuation or yield of Mutual Funds, Cash balance, Real Estate, etc.). "
                "Can identify asset by asset_id OR by asset_name/asset_type."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "asset_id":   {"type": "integer", "description": "Optional numeric ID of the asset to update."},
                    "asset_name": {"type": "string", "description": "Name or category of asset to update, e.g. 'Mutual Funds', 'Cash', 'Gold'."},
                    "value":      {"type": "string", "description": "New monetary value, e.g. '50 lakhs', '1.2 cr', '250000'."},
                    "yield_pct":  {"type": "number", "description": "New expected annual yield percentage."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compute_indian_tax",
            "description": (
                "Accurately compute Indian personal income tax liability under the New Tax Regime "
                "or Old Tax Regime with mathematical precision. Handles regular salary/income "
                "with standard deductions, plus special rate capital gains (Equity STCG @ 20%, "
                "Equity LTCG @ 12.5% above ₹1.25L exemption, Debt STCG), home loan deductions, cess, and rebates. "
                "ALWAYS call this tool whenever the user asks for tax calculation, liability, "
                "or salary tax breakdown."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "gross_salary": {
                        "type": "string",
                        "description": "Annual gross salary. Pass string with unit directly from user, e.g. '18 lakhs', '12.5L', '1800000'."
                    },
                    "other_income": {
                        "type": "string",
                        "description": "Other regular income subject to slab rates, e.g. '50000', '1 lakh'."
                    },
                    "equity_stcg": {
                        "type": "string",
                        "description": "Short-Term Capital Gains on listed equity (Section 111A), e.g. '2 lakhs' or '200000', taxed at flat 20%."
                    },
                    "equity_ltcg": {
                        "type": "string",
                        "description": "Long-Term Capital Gains on listed equity (Section 112A), e.g. '2.5 lakhs' or '250000', taxed at flat 12.5% on gains exceeding ₹1,25,000."
                    },
                    "debt_stcg": {
                        "type": "string",
                        "description": "Gains from debt mutual funds or unlisted debt taxed at marginal slab rates."
                    },
                    "home_loan_interest": {
                        "type": "string",
                        "description": "Annual interest paid on housing loan for self-occupied property (Section 24(b) deduction up to ₹2,00,000 in Old Regime; Nil in New Regime)."
                    },
                    "regime": {
                        "type": "string",
                        "enum": ["new", "old"],
                        "description": "Tax regime to compute under. Defaults to 'new'."
                    }
                },
                "required": []
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compute_side_income_tax",
            "description": (
                "Accurately calculate tax on new side income, freelance earnings, consulting fees, "
                "moonlighting, bonus, raise, or extra business revenue. "
                "Computes the exact incremental tax, in-hand take-home money, marginal tax rate, "
                "and Section 44ADA presumptive tax savings (50% expense deduction). "
                "ALWAYS call this tool whenever the user mentions new side income, freelance income, "
                "consulting, extra earnings, or asks how much tax they will pay on additional money."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "side_income": {
                        "type": "string",
                        "description": "Additional / side income amount. Pass string directly with unit, e.g. '5 lakhs', '50000', '3L', '2.5 lakhs'."
                    },
                    "base_salary": {
                        "type": "string",
                        "description": "User's current base salary (defaults to ₹24 Lakhs profile salary if not specified), e.g. '24 lakhs', '18L', or '0'."
                    },
                    "income_type": {
                        "type": "string",
                        "description": "Type of income: 'freelance', 'consulting', 'gig', 'bonus', 'rental', 'business'. Defaults to 'freelance'."
                    },
                    "regime": {
                        "type": "string",
                        "enum": ["new", "old"],
                        "description": "Tax regime. Defaults to 'new'."
                    }
                },
                "required": ["side_income"]
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_loan_and_emi",
            "description": (
                "Accurately calculate loan EMI, reverse-solve effective annual interest rate (IRR), "
                "compute total payment & total interest, analyze loan preclosure/prepayment savings, "
                "and determine applicable Indian tax codes & deductions (Section 24(b), Section 80C, "
                "Section 80E, Section 80EEB) under Old vs New Tax Regimes. "
                "ALWAYS call this tool whenever the user asks about loans, EMIs, effective interest rate, "
                "loan payoff, preclosure, or tax benefits on loans."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "principal": {
                        "type": "string",
                        "description": "Principal loan amount. Pass string directly with unit, e.g. '8.9 lakhs', '28 lakhs', '500000'."
                    },
                    "emi": {
                        "type": "string",
                        "description": "Monthly EMI amount. Pass string directly, e.g. '35.5k', '35,500', '25000'."
                    },
                    "rate": {
                        "type": "number",
                        "description": "Annual interest rate percentage (e.g. 8.5, 9.0). Leave empty if asking for interest rate."
                    },
                    "tenure_months": {
                        "type": "integer",
                        "description": "Total loan tenure in months (e.g. 36 for 3 years, 180 for 15 years)."
                    },
                    "tenure_years": {
                        "type": "number",
                        "description": "Total loan tenure in years (e.g. 3 for 3 years). Can be provided instead of tenure_months."
                    },
                    "loan_type": {
                        "type": "string",
                        "enum": ["Home Loan", "Car Loan", "Personal Loan", "Education Loan", "EV Loan"],
                        "description": "Type of loan to evaluate specific Indian tax codes (Section 24(b), 80C, 80E, 80EEB)."
                    },
                    "regime": {
                        "type": "string",
                        "enum": ["new", "old"],
                        "description": "Tax regime to evaluate deductions under. Defaults to 'new'."
                    }
                },
                "required": ["principal"]
            },
        },
    },
]


# ── Tool executor ────────────────────────────────────────────────────────────

def execute_tool(name: str, args: dict) -> str:
    """Execute a tool call and return a plain-text result string."""
    try:
        if name == "get_portfolio_summary":
            with database.get_db() as conn:
                assets = [dict(r) for r in conn.execute("SELECT * FROM assets ORDER BY id").fetchall()]
                liabs  = [dict(r) for r in conn.execute("SELECT * FROM liabilities ORDER BY id").fetchall()]
                prof = conn.execute("SELECT annual_income, monthly_inhand, monthly_expenses FROM user_profile LIMIT 1").fetchone()
                ann_inc = int(prof["annual_income"]) if prof and prof["annual_income"] else 2400000
                inhand = int(prof["monthly_inhand"]) if prof and prof["monthly_inhand"] else 160000
                exp = int(prof["monthly_expenses"]) if prof and prof["monthly_expenses"] else 55000

            total_a = sum(a["value"] for a in assets)
            total_l = sum(liab["remaining"] for liab in liabs)
            total_emi = sum(liab["emi"] for liab in liabs)
            net     = total_a - total_l
            surplus = max(0, inhand - total_emi - exp)

            lines = [
                f"=== LIVE USER FINANCIAL PORTFOLIO ===",
                f"• User: Advait",
                f"• Consolidated Net Worth: {fmt_inr(net)}",
                f"• Total Assets: {fmt_inr(total_a)} ({len(assets)} holdings)",
                f"• Total Debt / Liabilities: {fmt_inr(total_l)} (Total EMI: {fmt_inr(total_emi)}/month)",
                f"• Monthly In-Hand Cash: {fmt_inr(inhand)} / month (Annual CTC: {fmt_inr(ann_inc)})",
                f"• Monthly Living Expenses: {fmt_inr(exp)} / month",
                f"• Monthly Net Surplus: {fmt_inr(surplus)} / month",
                "",
                "ASSETS BREAKDOWN:",
            ]
            for a in assets:
                lines.append(f"  • [ID:{a['id']}] {a['type']}: {fmt_inr(a['value'])} — {a['label']} (Expected yield: {a['yield_pct']}% p.a.)")
            lines.append("")
            lines.append("LIABILITIES BREAKDOWN:")
            for liab in liabs:
                lines.append(f"  • [ID:{liab['id']}] {liab['type']}: {fmt_inr(liab['remaining'])} — {liab['label']} @ {liab['rate']}% interest, EMI: {fmt_inr(liab['emi'])}/mo, {liab['tenure']} months left")
            return "\n".join(lines)

        elif name == "add_asset":
            now = datetime.datetime.now().isoformat()
            valid = ['Equity', 'Mutual Funds', 'Gold', 'Real Estate', 'NPS/PPF', 'Cash']
            asset_type = args.get("type") or args.get("category") or args.get("asset_type") or "Cash"
            if asset_type not in valid:
                t_low = str(asset_type).lower()
                if "equity" in t_low or "stock" in t_low or "share" in t_low:
                    asset_type = "Equity"
                elif "mutual" in t_low or "fund" in t_low or "sip" in t_low:
                    asset_type = "Mutual Funds"
                elif "gold" in t_low or "silver" in t_low or "metal" in t_low:
                    asset_type = "Gold"
                elif "real" in t_low or "estate" in t_low or "property" in t_low or "flat" in t_low or "land" in t_low:
                    asset_type = "Real Estate"
                elif "ppf" in t_low or "nps" in t_low or "epf" in t_low or "provident" in t_low:
                    asset_type = "NPS/PPF"
                else:
                    asset_type = "Cash"

            raw_val = args.get("value") or args.get("amount") or args.get("val") or args.get("price") or args.get("balance")
            val = parse_indian_currency(raw_val)

            label = args.get("label") or args.get("name") or args.get("asset_name") or args.get("title")
            if not label:
                label = f"{asset_type} Asset"

            yield_pct = parse_indian_currency(args.get("yield_pct") or args.get("yield") or 0)

            with database.get_db() as conn:
                cur = conn.execute(
                    "INSERT INTO assets(type,label,value,yield_pct,created_at,updated_at) VALUES(?,?,?,?,?,?)",
                    (asset_type, str(label), val, yield_pct, now, now)
                )
                row = dict(conn.execute("SELECT * FROM assets WHERE id=?", (cur.lastrowid,)).fetchone())
                total_a = conn.execute("SELECT SUM(value) FROM assets").fetchone()[0] or 0
                total_l = conn.execute("SELECT SUM(remaining) FROM liabilities").fetchone()[0] or 0
                net = total_a - total_l

            return (
                f"SUCCESS: Successfully added asset '{row['label']}' ({row['type']}) worth ₹{row['value']:,.0f} (ID: {row['id']}). "
                f"Your Wealth Engine dashboard now reflects Total Assets: ₹{total_a:,.0f} and Net Worth: ₹{net:,.0f}."
            )

        elif name == "add_liability":
            now = datetime.datetime.now().isoformat()
            valid = ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan']
            liab_type = args.get("type") or args.get("category") or args.get("loan_type") or "Personal Loan"
            if liab_type not in valid:
                t_low = str(liab_type).lower()
                if "home" in t_low or "mortgage" in t_low or "house" in t_low:
                    liab_type = "Home Loan"
                elif "car" in t_low or "auto" in t_low or "vehicle" in t_low or "bike" in t_low:
                    liab_type = "Car Loan"
                elif "education" in t_low or "student" in t_low or "college" in t_low:
                    liab_type = "Education Loan"
                elif "card" in t_low or "credit" in t_low:
                    liab_type = "Credit Card"
                else:
                    liab_type = "Personal Loan"

            raw_rem = args.get("remaining") or args.get("principal") or args.get("amount") or args.get("value") or args.get("balance")
            rem = parse_indian_currency(raw_rem)

            label = args.get("label") or args.get("name") or args.get("loan_name") or args.get("title")
            if not label:
                label = f"{liab_type}"

            rate = parse_indian_currency(args.get("rate") or args.get("interest_rate") or 0)
            emi = parse_indian_currency(args.get("emi") or args.get("monthly") or 0)
            tenure = int(parse_indian_currency(args.get("tenure") or args.get("tenure_months") or 0))

            with database.get_db() as conn:
                cur = conn.execute(
                    "INSERT INTO liabilities(type,label,remaining,rate,emi,tenure,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
                    (liab_type, str(label), rem, rate, emi, tenure, now, now)
                )
                row = dict(conn.execute("SELECT * FROM liabilities WHERE id=?", (cur.lastrowid,)).fetchone())
                total_a = conn.execute("SELECT SUM(value) FROM assets").fetchone()[0] or 0
                total_l = conn.execute("SELECT SUM(remaining) FROM liabilities").fetchone()[0] or 0
                net = total_a - total_l

            return (
                f"SUCCESS: Successfully added liability '{row['label']}' ({row['type']}) with ₹{row['remaining']:,.0f} outstanding, "
                f"{row['rate']}% p.a. interest, EMI ₹{row['emi']:,.0f}/mo (ID: {row['id']}). "
                f"Your Wealth Engine dashboard now reflects Total Liabilities: ₹{total_l:,.0f} and Net Worth: ₹{net:,.0f}."
            )

        elif name == "delete_asset":
            asset_id = int(args["asset_id"])
            with database.get_db() as conn:
                row = conn.execute("SELECT label FROM assets WHERE id=?", (asset_id,)).fetchone()
                if not row:
                    return f"ERROR: No asset found with ID {asset_id}."
                label = row["label"]
                conn.execute("DELETE FROM assets WHERE id=?", (asset_id,))
            return f"SUCCESS: Deleted asset '{label}' (ID {asset_id}) from the Wealth Engine."

        elif name == "delete_liability":
            liab_id = int(args["liab_id"])
            with database.get_db() as conn:
                row = conn.execute("SELECT label FROM liabilities WHERE id=?", (liab_id,)).fetchone()
                if not row:
                    return f"ERROR: No liability found with ID {liab_id}."
                label = row["label"]
                conn.execute("DELETE FROM liabilities WHERE id=?", (liab_id,))
            return f"SUCCESS: Deleted liability '{label}' (ID {liab_id}) from the Wealth Engine."

        elif name == "update_liability":
            now = datetime.datetime.now().isoformat()
            liab_id = args.get("liab_id")
            loan_name = str(args.get("loan_name") or args.get("label") or args.get("type") or "").strip()
            raw_rem = args.get("remaining") or args.get("value") or args.get("amount") or args.get("principal")
            raw_rate = args.get("rate") or args.get("interest_rate")
            raw_emi = args.get("emi")
            raw_tenure = args.get("tenure")

            with database.get_db() as conn:
                target_row = None
                if liab_id is not None:
                    target_row = conn.execute("SELECT * FROM liabilities WHERE id=?", (int(liab_id),)).fetchone()
                if not target_row and loan_name:
                    target_row = conn.execute(
                        "SELECT * FROM liabilities WHERE label LIKE ? OR type LIKE ? ORDER BY id LIMIT 1",
                        (f"%{loan_name}%", f"%{loan_name}%")
                    ).fetchone()
                if not target_row:
                    target_row = conn.execute("SELECT * FROM liabilities ORDER BY remaining DESC LIMIT 1").fetchone()

                if not target_row:
                    return "ERROR: No matching liability found to update."

                target_id = target_row["id"]
                current_rem = target_row["remaining"]
                current_rate = target_row["rate"]
                current_emi = target_row["emi"]
                current_tenure = target_row["tenure"]

                new_rem = parse_indian_currency(raw_rem) if raw_rem is not None else current_rem
                new_rate = float(raw_rate) if raw_rate is not None else current_rate
                new_emi = parse_indian_currency(raw_emi) if raw_emi is not None else current_emi
                new_tenure = int(raw_tenure) if raw_tenure is not None else current_tenure

                conn.execute(
                    "UPDATE liabilities SET remaining=?, rate=?, emi=?, tenure=?, updated_at=? WHERE id=?",
                    (new_rem, new_rate, new_emi, new_tenure, now, target_id)
                )
                updated_row = dict(conn.execute("SELECT * FROM liabilities WHERE id=?", (target_id,)).fetchone())
                total_a = conn.execute("SELECT SUM(value) FROM assets").fetchone()[0] or 0
                total_l = conn.execute("SELECT SUM(remaining) FROM liabilities").fetchone()[0] or 0
                net = total_a - total_l

            return (
                f"SUCCESS: Updated liability '{updated_row['label']}' (ID: {updated_row['id']}). "
                f"Outstanding principal is now ₹{updated_row['remaining']:,.0f} (Rate: {updated_row['rate']}%, EMI: ₹{updated_row['emi']:,.0f}/mo). "
                f"Your Wealth Engine dashboard now reflects Total Liabilities: ₹{total_l:,.0f} and Net Worth: ₹{net:,.0f}."
            )

        elif name == "update_asset":
            now = datetime.datetime.now().isoformat()
            asset_id = args.get("asset_id")
            asset_name = str(args.get("asset_name") or args.get("label") or args.get("type") or "").strip()
            raw_val = args.get("value") or args.get("amount") or args.get("val")
            raw_yield = args.get("yield_pct") or args.get("yield")

            with database.get_db() as conn:
                target_row = None
                if asset_id is not None:
                    target_row = conn.execute("SELECT * FROM assets WHERE id=?", (int(asset_id),)).fetchone()
                if not target_row and asset_name:
                    target_row = conn.execute(
                        "SELECT * FROM assets WHERE label LIKE ? OR type LIKE ? ORDER BY id LIMIT 1",
                        (f"%{asset_name}%", f"%{asset_name}%")
                    ).fetchone()
                if not target_row:
                    return "ERROR: No matching asset found to update."

                target_id = target_row["id"]
                current_val = target_row["value"]
                current_yield = target_row["yield_pct"]

                new_val = parse_indian_currency(raw_val) if raw_val is not None else current_val
                new_yield = float(raw_yield) if raw_yield is not None else current_yield

                conn.execute(
                    "UPDATE assets SET value=?, yield_pct=?, updated_at=? WHERE id=?",
                    (new_val, new_yield, now, target_id)
                )
                updated_row = dict(conn.execute("SELECT * FROM assets WHERE id=?", (target_id,)).fetchone())
                total_a = conn.execute("SELECT SUM(value) FROM assets").fetchone()[0] or 0
                total_l = conn.execute("SELECT SUM(remaining) FROM liabilities").fetchone()[0] or 0
                net = total_a - total_l

            return (
                f"SUCCESS: Updated asset '{updated_row['label']}' (ID: {updated_row['id']}). "
                f"New valuation is ₹{updated_row['value']:,.0f} (Yield: {updated_row['yield_pct']}% p.a.). "
                f"Your Wealth Engine dashboard now reflects Total Assets: ₹{total_a:,.0f} and Net Worth: ₹{net:,.0f}."
            )

        elif name == "compute_indian_tax":
            regime_str = str(args.get("regime", "new")).lower()
            regime_enum = Regime.OLD if "old" in regime_str else Regime.NEW
            fy = args.get("fy") or "2024-25"

            raw_gross = args.get("gross_salary") or args.get("salary") or args.get("income") or 0
            raw_other = args.get("other_income") or args.get("side_income") or 0
            gross_sal = int(round(parse_indian_currency(raw_gross)))
            other_inc = int(round(parse_indian_currency(raw_other)))

            # If user only passed other_income/side_income and gross_salary is 0, keep it as other_income
            # Or if user passed a single general amount as income
            if gross_sal == 0 and other_inc > 0 and not args.get("gross_salary"):
                pass  # pure other income

            equity_stcg = int(round(parse_indian_currency(args.get("equity_stcg", 0))))
            equity_ltcg = int(round(parse_indian_currency(args.get("equity_ltcg", 0))))
            debt_stcg = int(round(parse_indian_currency(args.get("debt_stcg", 0))))
            hl_interest = int(round(parse_indian_currency(args.get("home_loan_interest", 0))))

            deductions_old = {}
            if regime_enum == Regime.OLD and hl_interest > 0:
                deductions_old["24b"] = min(hl_interest, 200000)

            # 1. Salary + Regular income tax (using versioned rules engine)
            breakdown = compute_income_tax(
                gross_salary=gross_sal,
                fy=fy,
                regime=regime_enum,
                other_income=other_inc + debt_stcg,
                deductions_old_regime=deductions_old if regime_enum == Regime.OLD else None,
            )

            # 2. Capital gains
            stcg_res = None
            if equity_stcg > 0:
                stcg_res = compute_capital_gains_tax(gain=equity_stcg, gain_type="equity_stcg", fy=fy)

            ltcg_res = None
            if equity_ltcg > 0:
                ltcg_res = compute_capital_gains_tax(gain=equity_ltcg, gain_type="equity_ltcg", fy=fy)

            cg_tax = (stcg_res.total_tax if stcg_res else 0) + (ltcg_res.total_tax if ltcg_res else 0)
            final_total_tax = breakdown.total_tax + cg_tax

            report = [
                f"=== INDIAN INCOME TAX COMPUTATION (FY {fy} | {regime_enum.value.upper()} REGIME) ===",
                f"Gross Salary: {fmt_inr(gross_sal)}",
                f"Standard Deduction: -{fmt_inr(breakdown.standard_deduction)}",
            ]
            if regime_enum == Regime.OLD and hl_interest > 0:
                report.append(f"Section 24(b) Home Loan Interest Deduction: -{fmt_inr(deductions_old.get('24b', 0))}")
            elif hl_interest > 0 and regime_enum == Regime.NEW:
                report.append("Section 24(b) Home Loan Interest: ₹0 deduction under New Tax Regime")

            if (other_inc + debt_stcg) > 0:
                report.append(f"Other Income / Debt STCG: {fmt_inr(other_inc + debt_stcg)}")

            report.extend([
                f"Net Taxable Income: {fmt_inr(breakdown.net_taxable_income)}",
                "",
                "PROGRESSIVE SLAB BREAKDOWN (SLICE-BY-SLICE):",
            ])
            for item in breakdown.slab_breakdown:
                report.append(f"  • {item['formula']}")
            report.append(f"Total Slab Tax: {fmt_inr(breakdown.slab_tax)}")

            if breakdown.rebate_87A > 0:
                report.append(f"Section 87A Rebate: -{fmt_inr(breakdown.rebate_87A)}")

            if stcg_res or ltcg_res:
                report.append("")
                report.append("CAPITAL GAINS TAX (FLAT RATES):")
                if stcg_res:
                    report.append(f"  • Equity STCG (Sec 111A): {fmt_inr(equity_stcg)} × 20% = {fmt_inr(stcg_res.tax)} (+ Cess = {fmt_inr(stcg_res.total_tax)})")
                if ltcg_res:
                    report.append(f"  • Equity LTCG (Sec 112A): ({fmt_inr(equity_ltcg)} − {fmt_inr(ltcg_res.exemption_applied)} exempt = {fmt_inr(ltcg_res.taxable_gain)}) × 12.5% = {fmt_inr(ltcg_res.tax)} (+ Cess = {fmt_inr(ltcg_res.total_tax)})")

            report.append("")
            report.append(f"Income Tax + Cess: {fmt_inr(breakdown.total_tax)}")
            if cg_tax > 0:
                report.append(f"Capital Gains Tax: {fmt_inr(cg_tax)}")
            report.append(f"TOTAL TAX PAYABLE: {fmt_inr(final_total_tax)}")
            report.append(f"Effective Tax Rate: {breakdown.effective_rate_pct:.2f}%")
            if breakdown.explanation.unverified_values:
                report.append(f"NOTE: Contains unverified provisions: {', '.join(breakdown.explanation.unverified_values)}")

            report.append("\n<!-- METRICS: " + json.dumps({
                "type": "tax_computation",
                "gross_income": gross_sal + other_inc,
                "net_taxable": breakdown.net_taxable_income,
                "total_tax": final_total_tax,
                "effective_rate": breakdown.effective_rate_pct,
                "regime": regime_enum.value,
            }) + " -->")

            return "\n".join(report)

        elif name == "compute_side_income_tax":
            side_inc = int(round(parse_indian_currency(args.get("side_income", 0))))
            base_sal_val = args.get("base_salary")
            if base_sal_val is None or str(base_sal_val).strip() == "":
                with database.get_db() as conn:
                    row = conn.execute("SELECT annual_income FROM user_profile LIMIT 1").fetchone()
                    base_sal = int(row['annual_income']) if row and row['annual_income'] else 2400000
            else:
                base_sal = int(round(parse_indian_currency(base_sal_val)))

            regime_str = str(args.get("regime", "new")).lower()
            regime_enum = Regime.OLD if "old" in regime_str else Regime.NEW
            inc_type = str(args.get("income_type", "freelance")).strip()
            fy = args.get("fy") or "2024-25"

            res = compute_side_income_tax(
                side_income=side_inc,
                base_salary=base_sal,
                regime=regime_enum,
                income_type=inc_type,
                fy=fy,
            )

            report = [
                f"=== DYNAMIC TAX COMPUTATION ON SIDE INCOME (FY {fy} | {regime_enum.value.upper()} REGIME) ===",
                f"• Additional Side Income: {fmt_inr(res.side_income)} ({res.income_type.title()})",
                f"• Base Salary Baseline: {fmt_inr(res.base_salary)}",
                f"• Combined Gross Income: {fmt_inr(res.base_salary + res.side_income)}",
                "",
                "CALCULATED END RESULT (STANDARD SLAB TAXATION):",
                f"• Baseline Tax on Salary: {fmt_inr(res.tax_base)}",
                f"• New Total Tax with Side Income: {fmt_inr(res.tax_with_side_income)}",
                f"• INCREMENTAL TAX ON SIDE INCOME: {fmt_inr(res.incremental_tax)}",
                f"• NET TAKE-HOME CASH IN-HAND: {fmt_inr(res.take_home_side_income)}",
                f"• Marginal Tax Rate on Side Income: {res.marginal_tax_rate_pct:.2f}%",
                f"• Effective Combined Tax Rate: {res.effective_overall_rate_pct:.2f}%",
            ]

            if res.sec_44ada_eligible:
                report.extend([
                    "",
                    "🌟 SECTION 44ADA PRESUMPTIVE TAXATION ADVANTAGE (FOR FREELANCERS & CONSULTANTS):",
                    f"• Presumptive Deemed Profit (50%): {fmt_inr(res.sec_44ada_presumptive_income)} (50% expense deduction without needing bills)",
                    f"• Reduced Incremental Tax: {fmt_inr(res.sec_44ada_incremental_tax)}",
                    f"• MAXIMIZED TAKE-HOME CASH: {fmt_inr(res.sec_44ada_take_home)}",
                    f"• TOTAL TAX SAVED VIA 44ADA: {fmt_inr(res.sec_44ada_tax_savings)}! 💰",
                ])

            report.append("\n<!-- METRICS: " + json.dumps({
                "type": "side_income_computation",
                "side_income": res.side_income,
                "base_salary": res.base_salary,
                "incremental_tax": res.incremental_tax,
                "take_home": res.take_home_side_income,
                "marginal_rate": res.marginal_tax_rate_pct,
                "sec_44ada_savings": res.sec_44ada_tax_savings if res.sec_44ada_eligible else 0,
                "sec_44ada_take_home": res.sec_44ada_take_home if res.sec_44ada_eligible else 0,
                "income_type": res.income_type,
            }) + " -->")

            return "\n".join(report)

        elif name == "calculate_loan_and_emi":
            principal = parse_indian_currency(args.get("principal", 0))
            emi = parse_indian_currency(args.get("emi", 0))
            rate = parse_indian_currency(args.get("rate", 0))
            tenure_months = int(parse_indian_currency(args.get("tenure_months", 0)))
            tenure_years = parse_indian_currency(args.get("tenure_years", 0))
            if tenure_months <= 0 and tenure_years > 0:
                tenure_months = int(round(tenure_years * 12))

            # Auto-detect Western-to-Indian lakh confusion:
            # If total_paid < principal, but principal / 10 < total_paid:
            # (e.g. LLM treated 8.9 lakhs as 8.9 million = 8900000 instead of 890000)
            if emi > 0 and tenure_months > 0 and principal > 0:
                if (emi * tenure_months) < principal and (emi * tenure_months) > (principal / 10.0):
                    principal = principal / 10.0

            loan_type = args.get("loan_type") or "Personal Loan"

            if principal <= 0:
                return "ERROR: Principal loan amount must be greater than 0."

            # Scenario 1: Solve for Effective Interest Rate given Principal, EMI, and Tenure
            if (rate <= 0) and emi > 0 and tenure_months > 0:
                low, high = 0.00001, 0.25  # up to 300% annual
                for _ in range(120):
                    mid = (low + high) / 2
                    calc_emi = principal * (mid * (1 + mid)**tenure_months) / ((1 + mid)**tenure_months - 1)
                    if calc_emi > emi:
                        high = mid
                    else:
                        low = mid
                rate = mid * 12 * 100.0

            # Scenario 2: Calculate EMI given Principal, Rate, and Tenure
            elif rate > 0 and tenure_months > 0 and emi <= 0:
                r = rate / 12 / 100.0
                emi = principal * (r * (1 + r)**tenure_months) / ((1 + r)**tenure_months - 1)

            # Scenario 3: Calculate Tenure given Principal, Rate, and EMI
            elif rate > 0 and emi > 0 and tenure_months <= 0:
                import math
                r = rate / 12 / 100.0
                if emi > principal * r:
                    tenure_months = int(math.ceil(-math.log(1 - (principal * r) / emi) / math.log(1 + r)))
                else:
                    return "ERROR: Monthly EMI is less than the monthly interest accrued. Loan can never be repaid."

            if tenure_months <= 0 or emi <= 0:
                return "ERROR: Please provide sufficient loan details (Principal, along with either [Rate + Tenure], [EMI + Tenure], or [Rate + EMI])."

            total_paid = emi * tenure_months
            total_interest = total_paid - principal

            report = [
                f"=== LOAN EMI & INTEREST ANALYSIS ({loan_type.upper()}) ===",
                f"Principal Loan Amount: ₹{principal:,.0f}",
                f"Tenure: {tenure_months} months ({tenure_months / 12:.1f} years)",
                f"Monthly EMI: ₹{round(emi):,.0f}",
                f"Effective Annual Interest Rate (APR/IRR): {rate:.2f}% p.a.",
                "",
                "PAYMENT & INTEREST BREAKDOWN:",
                f"  • Total Amount Paid over {tenure_months} months: {tenure_months} * ₹{round(emi):,.0f} = ₹{round(total_paid):,.0f}",
                f"  • Total Interest Paid: ₹{round(total_paid):,.0f} - ₹{principal:,.0f} = ₹{round(total_interest):,.0f}",
                f"  • Interest as % of Principal: {(total_interest / principal) * 100:.1f}%",
                "",
                "PRECLOSURE & PAYOFF RECOMMENDATION:",
            ]

            if rate >= 15.0:
                report.extend([
                    f"  🚨 HIGH INTEREST ALERT ({rate:.2f}% p.a.):",
                    f"  • This loan has an exceptionally high interest rate. Preclosing it early saves up to ₹{round(total_interest):,.0f} in interest!",
                    f"  • Prepaying gives you an immediate, guaranteed risk-free return of {rate:.2f}%, which far exceeds Equity/Mutual Fund returns (10-12%) and FD returns (7%).",
                    "  • STRONGLY RECOMMENDED: Preclose this loan as early as possible if you have surplus liquid funds.",
                ])
            elif rate >= 9.0:
                report.extend([
                    f"  ⚠️ MODERATE INTEREST ({rate:.2f}% p.a.):",
                    f"  • Preclosing saves up to ₹{round(total_interest):,.0f} in interest.",
                    "  • Prepaying is recommended if you do not have investments generating net post-tax returns higher than the loan rate.",
                ])
            else:
                report.extend([
                    f"  ✅ LOW INTEREST RATE ({rate:.2f}% p.a.):",
                    "  • This is a relatively low-cost loan. If your investments yield 10-12% p.a., continuing the loan while keeping funds invested in assets may generate higher net wealth.",
                ])

            report.append("  • Foreclosure Charges: Under RBI mandates, floating rate individual term loans have NIL prepayment penalties. Fixed-rate personal loans may incur 2-4% + GST.")

            report.extend([
                "",
                "INDIAN INCOME TAX CODES & DEDUCTIONS:",
            ])

            t_lower = loan_type.lower()
            if "home" in t_lower or "mortgage" in t_lower or "house" in t_lower:
                report.extend([
                    "  • Section 24(b) (Interest on Housing Loan):",
                    "    - Old Tax Regime: Maximum deduction of ₹2,00,000 per financial year for self-occupied property. For let-out property, entire actual interest is deductible (loss setoff against salary capped at ₹2L).",
                    "    - New Tax Regime: NIL (0) deduction for self-occupied property. Loss from house property cannot be set off against salary or other income heads.",
                    "  • Section 80C (Principal Repayment): Up to ₹1,50,000 per financial year (Old Regime only; not available in New Regime).",
                    "  • Section 80EE / 80EEA: Additional ₹50,000 / ₹1,50,000 deduction on interest for qualifying first-time home buyers (Old Regime only).",
                ])
            elif "education" in t_lower or "student" in t_lower:
                report.extend([
                    "  • Section 80E (Higher Education Loan Interest):",
                    "    - 100% of entire interest paid is deductible with NO UPPER CAP for up to 8 consecutive financial years (Old Regime only).",
                    "    - Nil deduction under the New Tax Regime.",
                ])
            elif "ev" in t_lower or "electric" in t_lower:
                report.extend([
                    "  • Section 80EEB (Electric Vehicle Loan Interest):",
                    "    - Deduction up to ₹1,50,000 per financial year on interest paid for an electric vehicle loan (Old Regime only).",
                ])
            else:
                report.extend([
                    "  • Personal / Car Loan Tax Provisions:",
                    "    - Salaried Individuals (Personal Use): ZERO tax deduction on either principal or interest under both Old and New Tax Regimes.",
                    "    - Self-Employed / Business Owners: Interest can be deducted as a business expenditure under Section 36(1)(iii) or Section 37(1), and vehicle depreciation (15%) can be claimed if used for business.",
                ])

            return "\n".join(report)

        else:
            return f"ERROR: Unknown tool '{name}'."

    except Exception as e:
        logger.error(f"Tool execution error for '{name}': {e}")
        return f"ERROR executing {name}: {e}"
