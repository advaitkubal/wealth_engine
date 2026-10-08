import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_statement(filename="SAMPLE_HDFC_CONSOLIDATED_STATEMENT.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    c_primary = colors.HexColor("#004c8f")    # HDFC Blue
    c_red = colors.HexColor("#ed1c24")        # HDFC Red
    c_dark = colors.HexColor("#1e293b")
    c_text = colors.HexColor("#334155")
    c_bg_light = colors.HexColor("#f8fafc")
    c_accent_bg = colors.HexColor("#f1f5f9")

    title_style = ParagraphStyle(
        'BankTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceAfter=2
    )

    sub_style = ParagraphStyle(
        'BankSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b")
    )

    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyTxt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_text
    )

    bold_style = ParagraphStyle(
        'BoldTxt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_dark
    )

    tbl_header = ParagraphStyle(
        'TblHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    story = []

    # Bank Header Bar
    header_data = [
        [
            Paragraph("<b>HDFC BANK LTD</b>", title_style),
            Paragraph("<b>CONSOLIDATED WEALTH &amp; ACCOUNT PORTFOLIO</b><br/>Statement Period: 01-Apr-2024 to 31-Mar-2025<br/>Generated: 08-Oct-2024", ParagraphStyle('RightHeader', parent=sub_style, alignment=2))
        ]
    ]
    t_head = Table(header_data, colWidths=[240, 300])
    t_head.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_head)
    story.append(HRFlowable(width="100%", thickness=2, color=c_red, spaceBefore=4, spaceAfter=8))

    # Customer & Branch Details
    cust_data = [
        [
            Paragraph("<b>Customer Name:</b> Advait Kubal", bold_style),
            Paragraph("<b>Customer ID:</b> 984021948", bold_style),
            Paragraph("<b>PAN:</b> ABCDE1234F", bold_style)
        ],
        [
            Paragraph("<b>Registered Branch:</b> Bandra West, Mumbai 400050", body_style),
            Paragraph("<b>Relationship:</b> Imperia Priority Banking", body_style),
            Paragraph("<b>Email:</b> advait.k@example.com", body_style)
        ]
    ]
    t_cust = Table(cust_data, colWidths=[180, 180, 180])
    t_cust.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_cust)
    story.append(Spacer(1, 10))

    # Executive Wealth Summary
    story.append(Paragraph("1. Consolidated Portfolio Valuation", h2_style))
    val_data = [
        [
            Paragraph("<b>Total Investment Assets:</b> ₹2,15,50,000", ParagraphStyle('ValAsset', parent=bold_style, textColor=colors.HexColor("#059669"))),
            Paragraph("<b>Total Outstanding Debt:</b> ₹48,50,000", ParagraphStyle('ValLiab', parent=bold_style, textColor=colors.HexColor("#e11d48"))),
            Paragraph("<b>Net Household Wealth:</b> ₹1,67,00,000", ParagraphStyle('ValNet', parent=bold_style, textColor=c_primary))
        ]
    ]
    t_val = Table(val_data, colWidths=[180, 180, 180])
    t_val.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#93c5fd")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_val)
    story.append(Spacer(1, 10))

    # SECTION 2: ASSETS BREAKDOWN
    story.append(Paragraph("2. Verified Liquid & Investment Assets", h2_style))
    assets_table_data = [
        [
            Paragraph("<b>Asset Category</b>", tbl_header),
            Paragraph("<b>Description / Holding Details</b>", tbl_header),
            Paragraph("<b>Yield / Return</b>", tbl_header),
            Paragraph("<b>Current Value (₹)</b>", tbl_header)
        ],
        [
            Paragraph("Cash", bold_style),
            Paragraph("HDFC Savings Account (A/c #50100482910)", body_style),
            Paragraph("3.50% p.a.", body_style),
            Paragraph("₹12,50,000", bold_style)
        ],
        [
            Paragraph("Fixed Deposit", bold_style),
            Paragraph("HDFC Special Fixed Deposit (15 Months Cumulative)", body_style),
            Paragraph("7.25% p.a.", body_style),
            Paragraph("₹25,00,000", bold_style)
        ],
        [
            Paragraph("Mutual Funds", bold_style),
            Paragraph("HDFC Top 100 & Parag Parikh Flexi Cap Fund", body_style),
            Paragraph("14.50% CAGR", body_style),
            Paragraph("₹78,00,000", bold_style)
        ],
        [
            Paragraph("Equity", bold_style),
            Paragraph("Direct Equities via HDFC Securities Demat (IN301151)", body_style),
            Paragraph("13.20% CAGR", body_style),
            Paragraph("₹65,00,000", bold_style)
        ],
        [
            Paragraph("Gold", bold_style),
            Paragraph("Sovereign Gold Bonds (RBI Tranche 2021-22)", body_style),
            Paragraph("8.50% p.a.", body_style),
            Paragraph("₹15,00,000", bold_style)
        ],
        [
            Paragraph("NPS/PPF", bold_style),
            Paragraph("Public Provident Fund & Tier-1 NPS Retirement", body_style),
            Paragraph("7.10% p.a.", body_style),
            Paragraph("₹20,00,000", bold_style)
        ],
    ]
    t_assets = Table(assets_table_data, colWidths=[80, 240, 100, 120])
    t_assets.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_assets)
    story.append(Spacer(1, 10))

    # SECTION 3: LIABILITIES BREAKDOWN
    story.append(Paragraph("3. Verified Loan Accounts & Liabilities", h2_style))
    liab_table_data = [
        [
            Paragraph("<b>Loan Type</b>", tbl_header),
            Paragraph("<b>Lender & Account Identifier</b>", tbl_header),
            Paragraph("<b>Interest Rate</b>", tbl_header),
            Paragraph("<b>Monthly EMI</b>", tbl_header),
            Paragraph("<b>Tenure Remaining</b>", tbl_header),
            Paragraph("<b>Outstanding Balance</b>", tbl_header)
        ],
        [
            Paragraph("Home Loan", bold_style),
            Paragraph("HDFC Bank Housing Loan #HL-982144", body_style),
            Paragraph("8.40%", body_style),
            Paragraph("₹36,500", body_style),
            Paragraph("168 mos", body_style),
            Paragraph("₹42,00,000", bold_style)
        ],
        [
            Paragraph("Car Loan", bold_style),
            Paragraph("HDFC Express Auto Loan #AL-402911", body_style),
            Paragraph("8.85%", body_style),
            Paragraph("₹15,200", body_style),
            Paragraph("42 mos", body_style),
            Paragraph("₹6,50,000", bold_style)
        ]
    ]
    t_liab = Table(liab_table_data, colWidths=[70, 180, 64, 70, 70, 90])
    t_liab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_red),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_liab)
    story.append(Spacer(1, 10))

    # SECTION 4: INCOME & ANNUAL TAX PROJECTION
    story.append(Paragraph("4. Statutory Income & TDS Summary", h2_style))
    inc_data = [
        [
            Paragraph("<b>Annual Salary Credit (Gross):</b> ₹36,00,000", bold_style),
            Paragraph("<b>TDS Deducted by Employer:</b> ₹6,12,000", bold_style),
            Paragraph("<b>Average Monthly Inflow:</b> ₹2,49,000", bold_style)
        ]
    ]
    t_inc = Table(inc_data, colWidths=[180, 180, 180])
    t_inc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_inc)
    story.append(Spacer(1, 12))

    # Statutory disclaimer
    story.append(Paragraph(
        "<b>Important Notice:</b> This is an authentic machine-readable consolidated financial statement generated by HDFC Bank Ltd. "
        "It contains verified account balances, loan schedules, asset valuations, and tax certificates suitable for algorithmic portfolio reconciliation.",
        sub_style
    ))

    doc.build(story)
    print(f"Sample bank statement created: {filename}")

if __name__ == '__main__':
    create_statement()
