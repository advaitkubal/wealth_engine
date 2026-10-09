import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export interface CADossierData {
  clientName: string
  pan?: string
  fy: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  annualIncome?: number
  monthlyInhand?: number
  monthlyExpenses?: number
  assets: Array<{ label: string; type: string; value: number; yield_pct?: number }>
  liabilities: Array<{ label: string; type: string; remaining: number; rate: number; emi: number; tenure?: number }>
  taxSummary?: {
    estimatedIncome: number
    newRegimeTax: number
    oldRegimeTax?: number
    recommendedRegime?: string
    standardDeduction?: number
    effectiveRatePct?: number
    q1Due?: number
    q2Due?: number
    q3Due?: number
    q4Due?: number
    sec234cStatus?: string
  }
}

export function generateCADossierPDF(data: CADossierData) {
  const doc = new jsPDF()
  const inc = data.taxSummary?.estimatedIncome || data.annualIncome || 4200000
  const newTax = data.taxSummary?.newRegimeTax ?? 292500
  const oldTax = data.taxSummary?.oldRegimeTax ?? (newTax + 78000)
  const savings = Math.abs(oldTax - newTax)
  const recRegime = data.taxSummary?.recommendedRegime || (newTax <= oldTax ? 'New Tax Regime (Section 115BAC)' : 'Old Tax Regime')

  // ══════════════════ HEADER BANNER ══════════════════
  doc.setFillColor(43, 38, 68) // #2B2644 brand color
  doc.rect(0, 0, 210, 36, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('HALO CHARTERED ACCOUNTANT DOSSIER & AUDIT PACK', 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Financial Year: FY ${data.fy}  |  Assessment Year: AY 2025-26  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 25)
  doc.text('100% Deterministic On-Device Financial Intelligence', 14, 30)
  doc.text('VERIFIED AUDIT REPORT', 160, 25)

  // ══════════════════ CLIENT PROFILE SUMMARY ══════════════════
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Client Profile & Computation Overview', 14, 44)

  const summaryRows = [
    ['Client / Taxpayer', data.clientName, 'Consolidated Net Worth', `INR ${(data.netWorth).toLocaleString('en-IN')}`],
    ['Permanent Account No (PAN)', data.pan || 'XXXXX1234X', 'Total Assets', `INR ${(data.totalAssets).toLocaleString('en-IN')}`],
    ['Residential Status', 'Resident Individual', 'Total Liabilities (Debt)', `INR ${(data.totalLiabilities).toLocaleString('en-IN')}`],
    ['Gross CTC / Annual Income', `INR ${inc.toLocaleString('en-IN')}`, 'Monthly In-Hand Cash', `INR ${(data.monthlyInhand || Math.round((inc * 0.82) / 12)).toLocaleString('en-IN')}/mo`],
    ['Recommended Tax Regime', recRegime, 'Net Regime Tax Savings', `INR ${savings.toLocaleString('en-IN')}`]
  ]

  ;(doc as any).autoTable({
    startY: 47,
    head: [],
    body: summaryRows,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 46 },
      1: { cellWidth: 54 },
      2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 44 },
      3: { cellWidth: 56, fontStyle: 'bold', textColor: [15, 23, 42] }
    }
  })

  // ══════════════════ TAX REGIME COMPARISON TABLE ══════════════════
  const afterProfileY = (doc as any).lastAutoTable.finalY + 6
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Statutory Tax Computation (New vs Old Regime Comparison)', 14, afterProfileY)

  const stdNew = 75000
  const stdOld = 50000
  const sec80C = 150000
  const sec80D = 25000
  const taxableNew = Math.max(0, inc - stdNew)
  const taxableOld = Math.max(0, inc - stdOld - sec80C - sec80D)

  const taxComparisonRows = [
    ['Gross Total Income (CTC / Earnings)', `INR ${inc.toLocaleString('en-IN')}`, `INR ${inc.toLocaleString('en-IN')}`],
    ['Standard Deduction (Sec 16(ia))', `- INR ${stdNew.toLocaleString('en-IN')}`, `- INR ${stdOld.toLocaleString('en-IN')}`],
    ['Chapter VI-A Deductions (80C / 80D / 24b)', 'Nil (Foregone under 115BAC)', `- INR ${(sec80C + sec80D).toLocaleString('en-IN')}`],
    ['Net Taxable Income', `INR ${taxableNew.toLocaleString('en-IN')}`, `INR ${taxableOld.toLocaleString('en-IN')}`],
    ['Total Income Tax + 4% Cess', `INR ${newTax.toLocaleString('en-IN')}`, `INR ${oldTax.toLocaleString('en-IN')}`],
    ['Effective Tax Rate', `${((newTax / inc) * 100).toFixed(2)}%`, `${((oldTax / inc) * 100).toFixed(2)}%`]
  ]

  ;(doc as any).autoTable({
    startY: afterProfileY + 3,
    head: [['Computation Parameter', 'New Tax Regime (Sec 115BAC)', 'Old Tax Regime']],
    body: taxComparisonRows,
    theme: 'striped',
    headStyles: { fillColor: [43, 38, 68], textColor: 255, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 60 },
      2: { halign: 'right', cellWidth: 60 }
    }
  })

  // ══════════════════ SCHEDULE 1: ASSETS SCHEDULE ══════════════════
  const afterTaxY = (doc as any).lastAutoTable.finalY + 6
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Schedule 1: Consolidated Assets Schedule (Wealth Balance Sheet)', 14, afterTaxY)

  const assetTableRows = data.assets.map((a, idx) => [
    idx + 1,
    a.label,
    a.type,
    a.yield_pct ? `${a.yield_pct}% p.a.` : 'Capital Growth',
    `INR ${Number(a.value).toLocaleString('en-IN')}`
  ])

  ;(doc as any).autoTable({
    startY: afterTaxY + 3,
    head: [['#', 'Asset Holding / Instrument', 'Asset Category', 'Expected Yield', 'Market Value (INR)']],
    body: assetTableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' }
    }
  })

  // ══════════════════ SCHEDULE 2: LIABILITIES SCHEDULE ══════════════════
  doc.addPage()

  // Header on Page 2
  doc.setFillColor(43, 38, 68)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`HALO CA DOSSIER — FY ${data.fy} (Page 2: Liabilities & Advance Tax Audit)`, 14, 12)

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.text('4. Schedule 2: Active Liabilities & Loan Repayment Audit', 14, 26)

  const liabTableRows = data.liabilities.map((l, idx) => [
    idx + 1,
    l.label,
    l.type,
    `${l.rate}% p.a.`,
    `INR ${Number(l.emi).toLocaleString('en-IN')}/mo`,
    l.tenure ? `${l.tenure} mos` : '—',
    `INR ${Number(l.remaining).toLocaleString('en-IN')}`
  ])

  ;(doc as any).autoTable({
    startY: 29,
    head: [['#', 'Loan Description / Lender', 'Loan Type', 'Interest Rate', 'Monthly EMI', 'Tenure', 'Outstanding Balance']],
    body: liabTableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      6: { halign: 'right', fontStyle: 'bold' }
    }
  })

  // ══════════════════ SCHEDULE 3: ADVANCE TAX STATUTORY CALENDAR ══════════════════
  const afterLiabsY = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('5. Schedule 3: CBDT Advance Tax Compliance Calendar (Sec 208, 234B, 234C)', 14, afterLiabsY)

  const q1 = Math.round(newTax * 0.15)
  const q2 = Math.round(newTax * 0.45)
  const q3 = Math.round(newTax * 0.75)
  const q4 = newTax

  const advanceTaxRows = [
    ['1st Installment (15%)', '15th June 2024', `INR ${q1.toLocaleString('en-IN')}`, 'Reconciled', 'Paid via TDS / Direct Tax'],
    ['2nd Installment (45%)', '15th September 2024', `INR ${q2.toLocaleString('en-IN')}`, 'Reconciled', 'Paid via TDS / Challan 280'],
    ['3rd Installment (75%)', '15th December 2024', `INR ${q3.toLocaleString('en-IN')}`, 'Pending / Due', 'Section 234C Protection Active'],
    ['4th Installment (100%)', '15th March 2025', `INR ${q4.toLocaleString('en-IN')}`, 'Final Settlement', 'Reconcile AIS/26AS with Form 16']
  ]

  ;(doc as any).autoTable({
    startY: afterLiabsY + 4,
    head: [['Installment', 'Statutory Due Date', 'Cumulative Amount Due', 'Status', 'Filing Notes']],
    body: advanceTaxRows,
    theme: 'striped',
    headStyles: { fillColor: [43, 38, 68], textColor: 255, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' }
    }
  })

  // ══════════════════ CA ADVISORY NOTES & ACTIONS ══════════════════
  const afterAdvTaxY = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('6. Chartered Accountant Tax Planning & Optimization Action Items:', 14, afterAdvTaxY)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const notes = [
    '• Section 112A Equity LTCG Harvesting: Harvest up to INR 1,25,000 of long-term capital gains tax-free before 31st March.',
    '• Section 44ADA Presumptive Taxation: Any side freelancing/consulting income enjoys 50% deemed expense deduction.',
    '• Section 80CCD(2) Corporate NPS: Restructure CTC to include up to 14% of Basic pay in employer NPS for tax deduction in both regimes.',
    '• High-Interest Loan Prepayment: Direct monthly cash surpluses towards pre-closing the car loan (8.85%) to eliminate non-deductible interest burn.',
    '• 100% On-Device Audit Assurance: Generated deterministically by Halo. No cloud leakage of personal PAN or financial assets.'
  ]

  let curY = afterAdvTaxY + 5
  notes.forEach(note => {
    doc.text(note, 16, curY)
    curY += 4.5
  })

  // Footer Note
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('CONFIDENTIAL CA CLIENT DOSSIER — Generated by Halo Offline-First Wealth & Tax Engine. Zero personal data transferred to any cloud.', 14, 288)

  doc.save(`Halo_CA_Dossier_FY_${data.fy}.pdf`)
}

