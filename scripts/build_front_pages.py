import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import subprocess
import os

def create_front_pages(output_docx, output_doc):
    doc = docx.Document()
    
    # Configure A4 page and 1.5" left, 1.0" others
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(1.5)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.5)
    section.right_margin = Inches(1.0)
    
    # Set standard Normal style to Times New Roman
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)
    
    # Helper to add centered text
    def add_p(text="", size=12, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6, line_spacing=1.5):
        p = doc.add_paragraph()
        p.paragraph_format.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            r = p.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(size)
            r.font.bold = bold
        return p

    # ==========================================
    # PAGE 1: TITLE COVER
    # ==========================================
    add_p("Mini Project Report", size=14, bold=False, space_after=4)
    add_p("on", size=14, bold=False, space_after=12)
    add_p("HALO: PRIVACY-FIRST DETERMINISTIC AI WEALTH INTELLIGENCE ENGINE AND FINANCIAL PLANNING ASSISTANT", size=18, bold=True, space_after=18)
    
    add_p("Submitted in the partial fulfillment of the requirements\nfor the degree of", size=12, bold=False, space_after=4)
    add_p("Bachelor in Technology (Computer & Communication Engineering)", size=14, bold=True, space_after=16)
    
    add_p("by", size=12, bold=False, space_after=8)
    
    members = [
        ("Advait Kubal", "16010423001"),
        ("Sparsh Kumar", "16010423002"),
        ("Swaroop Mane", "16010423003"),
        ("Ishika Poddar", "16010423004")
    ]
    for name, roll in members:
        add_p(name, size=13, bold=True, space_after=1)
        add_p(f"Roll No: {roll}", size=11, bold=False, space_after=6)
        
    add_p("Under the Guidance of", size=12, bold=False, space_after=4)
    add_p("Prof. [Project Guide Name]", size=14, bold=True, space_after=16)
    
    add_p("Department of Electronics and Telecommunication Engineering", size=13, bold=True, space_after=3)
    add_p("K. J. Somaiya School of Engineering", size=14, bold=True, space_after=3)
    add_p("Somaiya Vidyavihar University, Mumbai - 400077", size=12, bold=False, space_after=3)
    add_p("Batch 2023 - 2027", size=13, bold=True, space_after=0)
    
    doc.add_page_break()

    # ==========================================
    # PAGE 2: CERTIFICATE
    # ==========================================
    add_p("K J Somaiya School of Engineering, Mumbai-77", size=14, bold=True, space_after=12)
    add_p("Certificate", size=18, bold=True, space_after=24)
    
    cert_text = (
        "This is to certify that the Mini project report entitled \"Halo: Privacy-First Deterministic "
        "AI Wealth Intelligence Engine and Financial Planning Assistant\" is a bonafide record of the work done by "
        "Advait Kubal, Sparsh Kumar, Swaroop Mane, and Ishika Poddar in the academic year 2025-2026 under the guidance of "
        "Prof. [Project Guide Name] in partial fulfillment of the requirement for the degree of Bachelor in Technology in "
        "Computer & Communication Engineering of Somaiya Vidyavihar University."
    )
    add_p(cert_text, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=48, line_spacing=1.5)
    
    add_p("___________________________\nGuide\nDepartment of Electronics & Telecommunication Engineering", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=36)
    
    add_p("Date: November 2025\nPlace: Mumbai-77", size=12, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=0)
    
    doc.add_page_break()

    # ==========================================
    # PAGE 3: CERTIFICATE OF APPROVAL OF EXAMINERS
    # ==========================================
    add_p("Somaiya Vidyavihar University", size=14, bold=True, space_after=2)
    add_p("K. J. Somaiya College of Engineering", size=13, bold=True, space_after=2)
    add_p("(Constituent College of Somaiya Vidyavihar University)", size=11, bold=False, space_after=12)
    add_p("Certificate of Approval of Examiners", size=16, bold=True, space_after=24)
    
    exam_text = (
        "This is to certify that the Mini project report entitled \"Halo: Privacy-First Deterministic "
        "AI Wealth Intelligence Engine and Financial Planning Assistant\" is a bonafide record of the work done by "
        "Advait Kubal, Sparsh Kumar, Swaroop Mane, and Ishika Poddar in partial fulfillment of the requirement for the "
        "degree of Bachelor in Technology in Computer & Communication Engineering of Somaiya Vidyavihar University."
    )
    add_p(exam_text, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=48, line_spacing=1.5)
    
    tbl_exam = doc.add_table(rows=2, cols=2)
    tbl_exam.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_exam.rows[0].cells[0].paragraphs[0].text = "___________________________"
    tbl_exam.rows[0].cells[1].paragraphs[0].text = "___________________________"
    tbl_exam.rows[1].cells[0].paragraphs[0].text = "Expert / External Examiner"
    tbl_exam.rows[1].cells[1].paragraphs[0].text = "Internal Examiner / Guide"
    for r in tbl_exam.rows:
        for c in r.cells:
            c.paragraphs[0].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in c.paragraphs[0].runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(12)
                run.font.bold = True
                
    add_p("", size=12, space_after=36)
    add_p("Date: November 2025\nPlace: Mumbai-77", size=12, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=0)
    
    doc.add_page_break()

    # ==========================================
    # PAGE 4: DECLARATION
    # ==========================================
    add_p("K. J. Somaiya School of Engineering, Mumbai-77", size=14, bold=True, space_after=12)
    add_p("DECLARATION", size=16, bold=True, space_after=20)
    
    decl_p1 = (
        "We declare that this written report submission represents the work done based on our and / or others’ ideas "
        "with adequately cited and referenced the original source. We also declare that we have adhered to all principles of "
        "intellectual property, academic honesty and integrity as we have not misinterpreted or fabricated or falsified any "
        "idea/data/fact/source/original work/matter in our submission."
    )
    add_p(decl_p1, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=14, line_spacing=1.5)
    
    decl_p2 = (
        "We understand that any violation of the above will be cause for disciplinary action by the college and may evoke "
        "the penal action from the sources which have not been properly cited or from whom proper permission is not sought."
    )
    add_p(decl_p2, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=24, line_spacing=1.5)
    
    tbl_sign = doc.add_table(rows=4, cols=2)
    tbl_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (m_name, m_roll) in enumerate(members):
        tbl_sign.rows[idx].cells[0].paragraphs[0].text = f"_____________________________\nSignature of the Student\n{m_name}"
        tbl_sign.rows[idx].cells[1].paragraphs[0].text = f"\n\nRoll No.: {m_roll}"
        for c in tbl_sign.rows[idx].cells:
            for p in c.paragraphs:
                p.paragraph_format.line_spacing = 1.3
                for run in p.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(11)
                    
    add_p("", size=12, space_after=24)
    add_p("Date: November 2025\nPlace: Mumbai-77", size=12, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=0)
    
    doc.add_page_break()

    # ==========================================
    # PAGE 5: ABSTRACT
    # ==========================================
    add_p("Abstract", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=16)
    
    abs_p1 = (
        "The rapid digitization of financial services in India has enabled retail investors to accumulate diverse "
        "portfolios across mutual funds, direct equities, fixed deposits, employee provident funds (EPF/PPF), and "
        "statutory tax-saving instruments. Concurrently, personal debt obligations—including home loans, vehicle loans, "
        "and education loans—have expanded in complexity. However, contemporary commercial wealth management and fintech "
        "platforms mandate the transmission of sensitive personal financial documents (Consolidated Account Statements, "
        "Form 16s, bank statements, and Permanent Account Numbers) to centralized cloud servers. This architecture "
        "introduces severe privacy vulnerabilities, third-party data tracking, and vulnerability to catastrophic data breaches. "
        "Furthermore, modern cloud-based conversational artificial intelligence systems compute financial numbers probabilistically, "
        "frequently generating numerical hallucinations in tax slabs, debt amortizations, and compound growth trajectories."
    )
    add_p(abs_p1, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.5)
    
    abs_p2 = (
        "To resolve these foundational challenges, this project presents 'Halo', a 100% on-device, air-gapped personal "
        "wealth intelligence engine and financial planning assistant designed specifically for the Indian financial ecosystem. "
        "Halo enforces a strict deterministic-first architecture: a local quantized Large Language Model (via Ollama) is "
        "orchestrated through LangGraph state graphs and Pydantic validation nodes exclusively for intent routing, parameter "
        "extraction, and natural language explanation. Crucially, 100% of arithmetic, tax liability computations, debt payoff "
        "trajectories, and portfolio analytics are executed by pure, verified Python mathematical modules, ensuring zero "
        "numerical hallucinations. The system incorporates a dynamic Indian Income Tax engine compliant with Union Budget 2024 "
        "revisions (comparing Old vs New regimes, Section 87A rebate and marginal relief, and Section 234 interest), on-device "
        "document intelligence for CAS PDFs via local vector search (sqlite-vec), multi-scenario What-If life decision simulators "
        "(Debt Avalanche vs Snowball, Prepay vs Invest, FIRE corpus, and Emergency Runway), and a 1-click audit-ready Chartered "
        "Accountant handoff dossier. Benchmarks confirm sub-15ms calculation latencies, local LLM responses within 2.5 seconds, "
        "and exactly 0 bytes of network data egress, providing verifiable privacy and mathematical accuracy."
    )
    add_p(abs_p2, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=16, line_spacing=1.5)
    
    kw_p = add_p("", size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=0)
    r_kw_bold = kw_p.add_run("Keywords: ")
    r_kw_bold.font.name = 'Times New Roman'
    r_kw_bold.font.size = Pt(12)
    r_kw_bold.font.bold = True
    r_kw_text = kw_p.add_run("Local Large Language Models, Deterministic Computing, Privacy-Preserving FinTech, Indian Income Tax Engine, LangGraph, Retrieval-Augmented Generation (RAG), Personal Wealth Intelligence.")
    r_kw_text.font.name = 'Times New Roman'
    r_kw_text.font.size = Pt(12)
    
    doc.add_page_break()

    # ==========================================
    # PAGE 6: CONTENTS
    # ==========================================
    add_p("Contents", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)
    
    toc_data = [
        ("List of Figures", "viii"),
        ("List of Tables", "ix"),
        ("Nomenclature", "x"),
        ("1   Introduction", "1"),
        ("    1.1   Background", "1"),
        ("    1.2   Motivation", "3"),
        ("    1.3   Scope of the Project", "4"),
        ("    1.4   Organization of the Report", "5"),
        ("2   Literature Survey", "6"),
        ("    2.1   Review of Contemporary Financial Advisory Systems", "6"),
        ("    2.2   Local & Privacy-Preserving AI Architectures", "8"),
        ("    2.3   Deterministic Computing vs Generative LLM Hallucinations", "10"),
        ("    2.4   Comparative Summary of Literature", "12"),
        ("    2.5   Objectives of the Project", "13"),
        ("3   Project Design & Mathematical Background", "14"),
        ("    3.1   System Architecture & Design Philosophy", "14"),
        ("    3.2   Problem Statement & Formulation", "16"),
        ("    3.3   System Block Diagram & Pipeline", "18"),
        ("    3.4   Mathematical Formulations & Engines", "20"),
        ("          3.4.1   Indian Income Tax Engine (New vs Old Regimes, Sec 87A, 234)", "20"),
        ("          3.4.2   Debt Amortization & Strategy Algorithms (Avalanche vs Snowball)", "23"),
        ("          3.4.3   Investment Analytics (CAGR, XIRR, Regular vs Direct Drag)", "25"),
        ("          3.4.4   Monte Carlo FIRE & Emergency Runway Modeling", "27"),
        ("4   Implementation and Experimentation", "29"),
        ("    4.1   Technology Stack & On-Device Environment", "29"),
        ("    4.2   LangGraph Orchestration & Validation Guardrails", "31"),
        ("    4.3   Document Intelligence & Local Vector Database (sqlite-vec)", "34"),
        ("    4.4   User Interface & Interactive Financial Cockpit", "36"),
        ("    4.5   Results, Benchmark Analysis & Verification", "39"),
        ("5   Conclusions and Future Work", "43"),
        ("    5.1   Summary of Findings", "43"),
        ("    5.2   Key Conclusions", "44"),
        ("    5.3   Future Scope", "45"),
        ("References", "46"),
        ("Appendix A: Statutory Tax Formulas & Golden Test Suite", "49")
    ]
    
    tbl_toc = doc.add_table(rows=len(toc_data), cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, page) in enumerate(toc_data):
        row = tbl_toc.rows[idx]
        is_h1 = (title.strip().startswith(("1 ", "2 ", "3 ", "4 ", "5 ", "References", "Appendix", "List", "Nomenclature")))
        p0 = row.cells[0].paragraphs[0]
        p0.paragraph_format.line_spacing = 1.3
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(title)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11)
        r0.font.bold = is_h1
        
        p1 = row.cells[1].paragraphs[0]
        p1.paragraph_format.line_spacing = 1.3
        p1.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(page)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11)
        r1.font.bold = is_h1
        
    doc.add_page_break()

    # ==========================================
    # PAGE 7: LIST OF FIGURES & LIST OF TABLES
    # ==========================================
    add_p("List of Figures", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    figs = [
        ("1.1", "System Architecture of Halo Offline Financial Intelligence Engine", "2"),
        ("3.1", "High-Level End-to-End System Block Diagram", "18"),
        ("3.2", "LangGraph State Machine with Pydantic Validation Gatekeeper", "19"),
        ("3.3", "Document Ingestion & Local RAG Vector Pipeline", "20"),
        ("3.4", "Tax Calculation Pipeline & Dual-Regime Comparison Flow", "22"),
        ("3.5", "Debt Avalanche vs Snowball Repayment Trajectories", "24"),
        ("3.6", "Monte Carlo FIRE Retirement Corpus Probability Distribution", "28"),
        ("4.1", "Halo Today Cockpit & Real-Time Financial Health Dashboard", "36"),
        ("4.2", "Interactive What-If Scenario Simulators & Prepay vs Invest UI", "37"),
        ("4.3", "Hands-Free Voice Assistant with Visual Countdown Feedback", "38"),
        ("4.4", "1-Click CA Audit Handoff Dossier Export View", "39"),
        ("4.5", "Air-Gap Network Egress Assertion & Latency Benchmark Comparison", "41")
    ]
    tbl_fig = doc.add_table(rows=len(figs), cols=3)
    tbl_fig.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (num, title, pg) in enumerate(figs):
        row = tbl_fig.rows[idx]
        for c_idx, txt in enumerate([num, title, pg]):
            p = row.cells[c_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.2
            if c_idx == 2:
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            r = p.add_run(txt)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            
    add_p("", size=12, space_after=18)
    add_p("List of Tables", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    tbls = [
        ("2.1", "Comparative Evaluation: Commercial Fintech Platforms vs Halo", "12"),
        ("3.1", "Indian Income Tax Slab Rates (New Regime vs Old Regime Budget 2024)", "21"),
        ("3.2", "Statutory Interest Rates and Thresholds for Sections 234A, 234B, and 234C", "23"),
        ("3.3", "Capital Gains Tax Rates (LTCG / STCG post-July 23, 2024)", "26"),
        ("4.1", "Software Specifications and Development Dependencies", "30"),
        ("4.2", "Hardware Resource Utilization & Response Latency Benchmarks", "40"),
        ("4.3", "Comparative Matrix: Halo vs Cloud-Based Wealth Management Solutions", "42")
    ]
    tbl_tbl = doc.add_table(rows=len(tbls), cols=3)
    tbl_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (num, title, pg) in enumerate(tbls):
        row = tbl_tbl.rows[idx]
        for c_idx, txt in enumerate([num, title, pg]):
            p = row.cells[c_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.2
            if c_idx == 2:
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            r = p.add_run(txt)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)

    doc.add_page_break()

    # ==========================================
    # PAGE 8: NOMENCLATURE
    # ==========================================
    add_p("Nomenclature", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=16)
    
    nomenclatures = [
        ("Y", "Gross Total Annual Income of the individual taxpayer (₹)"),
        ("Y_taxable", "Net Taxable Income after allowable chapter VI-A deductions and standard deduction (₹)"),
        ("D_std", "Statutory Standard Deduction under Indian Income-tax Act (₹75,000 for New Regime, ₹50,000 Old)"),
        ("T_gross", "Gross Income Tax computed on taxable slabs prior to rebates, surcharges, and cess (₹)"),
        ("R_87A", "Statutory tax rebate computed under Section 87A of the Income-tax Act (₹)"),
        ("T_net", "Net Tax Liability payable after statutory rebates, marginal relief, surcharges, and 4% cess (₹)"),
        ("P", "Outstanding principal balance of a loan liability (₹)"),
        ("r", "Monthly statutory or contract interest rate (Annual Nominal Rate / 12 / 100)"),
        ("n", "Total remaining amortization tenure in months"),
        ("EMI", "Equated Monthly Installment computed via standard continuous amortization (₹)"),
        ("CAGR", "Compound Annual Growth Rate of portfolio asset holdings (%)"),
        ("XIRR", "Extended Internal Rate of Return computed across irregular cash flow dates (%)"),
        ("F_FIRE", "Target Financial Independence Retirement Early corpus value (₹)"),
        ("SWR", "Safe Withdrawal Rate applied to annual retirement expenditures (typically 3.5% - 4.0%)"),
        ("M_runway", "Emergency liquidity survival runway expressed in integer calendar months"),
        ("RAG", "Retrieval-Augmented Generation"),
        ("LLM", "Large Language Model (Quantized local inference model)"),
        ("CAS", "Consolidated Account Statement (AMFI / CAMS / KFintech mutual fund registry)"),
        ("PII", "Personally Identifiable Information"),
        ("HUF", "Hindu Undivided Family (Recognized separate tax entity under Indian tax law)"),
        ("EPF/PPF", "Employee Provident Fund / Public Provident Fund"),
        ("FOSS", "Free and Open-Source Software")
    ]
    
    tbl_nom = doc.add_table(rows=len(nomenclatures), cols=2)
    tbl_nom.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (sym, desc) in enumerate(nomenclatures):
        row = tbl_nom.rows[idx]
        p0 = row.cells[0].paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        p0.paragraph_format.line_spacing = 1.2
        r0 = p0.add_run(sym)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11)
        r0.font.bold = True
        
        p1 = row.cells[1].paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.line_spacing = 1.2
        r1 = p1.add_run(desc)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11)
        
    # Save docx
    doc.save(output_docx)
    print(f"Saved docx: {output_docx}")
    
    # Convert to doc using textutil
    cmd = ["textutil", "-convert", "doc", output_docx, "-output", output_doc]
    subprocess.check_call(cmd)
    print(f"Saved doc: {output_doc}")

if __name__ == "__main__":
    create_front_pages("pdfs/CCE Sem V Mini Project Report_front pages.docx", "pdfs/CCE Sem V Mini Project Report_front pages.doc")
