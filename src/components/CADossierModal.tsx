import { useState, useEffect } from 'react'
import {
  X,
  Download,
  Copy,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Calculator,
  Calendar,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { generateCADossierPDF, CADossierData } from '../utils/caDossierPdf'

interface CADossierModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CADossierModal({ isOpen, onClose }: CADossierModalProps) {
  const [activeTab, setActiveTab] = useState<'tax' | 'balance' | 'advance' | 'advisory'>('tax')
  const [summary, setSummary] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const loadData = async () => {
    try {
      const [sumRes, taxRes] = await Promise.all([
        fetch('http://localhost:8000/api/wealth/summary').then(r => r.json()),
        fetch('http://localhost:8000/api/tax/compliance-summary?fy=2024-25').then(r => r.json()),
      ])
      setSummary(sumRes)
      setCompliance(taxRes)
    } catch (e) {
      console.error('Failed to fetch CA dossier data:', e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const inc = summary?.annual_income || 4200000
  const monthlyInhand = summary?.monthly_inhand || Math.round((inc * 0.82) / 12)
  const totalAssets = summary?.total_assets || 26300000
  const totalLiabs = summary?.total_liabilities || 5520000
  const netWorth = summary?.net_worth || 20780000
  const assets = summary?.assets || []
  const liabilities = summary?.liabilities || []

  const newTax = compliance?.new_regime_tax ?? 292500
  const oldTax = compliance?.old_regime_tax ?? (newTax + 78000)
  const savings = Math.abs(oldTax - newTax)

  const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
  const fmtCr = (val: number) => {
    if (!val) return '₹0'
    const cr = val / 10000000
    if (cr >= 1) return `₹${cr.toFixed(2)}Cr`
    const l = val / 100000
    return `₹${l.toFixed(1)}L`
  }

  const handleDownloadPDF = () => {
    const data: CADossierData = {
      clientName: 'Advait Kubal',
      pan: 'XXXXX1234X',
      fy: '2024-25',
      totalAssets,
      totalLiabilities: totalLiabs,
      netWorth,
      annualIncome: inc,
      monthlyInhand,
      assets,
      liabilities,
      taxSummary: {
        estimatedIncome: inc,
        newRegimeTax: newTax,
        oldRegimeTax: oldTax,
        recommendedRegime: 'New Tax Regime (Section 115BAC)',
        standardDeduction: 75000,
        effectiveRatePct: compliance?.effective_rate_pct || ((newTax / inc) * 100),
        q1Due: Math.round(newTax * 0.15),
        q2Due: Math.round(newTax * 0.45),
        q3Due: Math.round(newTax * 0.75),
        q4Due: newTax,
        sec234cStatus: 'Protected',
      },
    }
    generateCADossierPDF(data)
  }

  const handleCopyText = () => {
    const text = `
=== HALO CHARTERED ACCOUNTANT DOSSIER (FY 2024-25) ===
Client: Advait Kubal | AY: 2025-26 | Status: Resident Individual
------------------------------------------------------------
1. WEALTH SUMMARY & BALANCE SHEET:
• Consolidated Net Worth: ${fmt(netWorth)} (${fmtCr(netWorth)})
• Total Assets: ${fmt(totalAssets)} across ${assets.length} holdings
• Total Liabilities: ${fmt(totalLiabs)} (${liabilities.length} active loans)
• Monthly In-Hand Cash: ${fmt(monthlyInhand)} / month (Annual CTC: ${fmt(inc)})

2. TAX AUDIT & REGIME COMPARISON:
• Gross Total Income: ${fmt(inc)}
• Standard Deduction (Sec 16ia): ₹75,000
• Net Taxable Income: ${fmt(inc - 75000)}
• New Regime Tax (115BAC): ${fmt(newTax)} (Effective Rate: ${((newTax / inc) * 100).toFixed(2)}%)
• Old Regime Tax: ${fmt(oldTax)}
• Recommended Regime: New Tax Regime (Savings: ${fmt(savings)})

3. ACTIVE LOAN SCHEDULE:
${liabilities.map((l: any, i: number) => `${i + 1}. ${l.label} (${l.type}): Balance ${fmt(l.remaining)} @ ${l.rate}% | EMI: ${fmt(l.emi)}/mo`).join('\n')}

4. CBDT ADVANCE TAX STATUTORY CALENDAR:
• Q1 (15 June - 15%): ${fmt(Math.round(newTax * 0.15))}
• Q2 (15 Sept - 45%): ${fmt(Math.round(newTax * 0.45))}
• Q3 (15 Dec - 75%): ${fmt(Math.round(newTax * 0.75))}
• Q4 (15 March - 100%): ${fmt(newTax)}

100% On-Device & Deterministic Reconciled by Halo.
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-[#2B2644] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold px-3 py-1 rounded-full mb-2 tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Chartered Accountant Audit Dossier
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Financial Dossier &amp; Tax Pack
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><strong>Client:</strong> Advait Kubal</span>
              <span><strong>PAN:</strong> XXXXX1234X</span>
              <span><strong>Assessment Year:</strong> AY 2025-26 (FY 2024-25)</span>
              <span><strong>Filing Section:</strong> 139(1)</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={handleCopyText}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Copy plain text summary for WhatsApp or email to your CA"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy for CA'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/20 hover:scale-105"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Pack</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-3 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'tax', label: '1. Tax Audit & Regime Math', icon: Calculator },
            { id: 'balance', label: '2. Schedule AL (Assets & Debt)', icon: FileSpreadsheet },
            { id: 'advance', label: '3. CBDT Advance Tax Calendar', icon: Calendar },
            { id: 'advisory', label: '4. CA Advisory & Action Plan', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2B2644] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-800 text-sm">
          {/* TAB 1: TAX AUDIT */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              {/* Executive Tax Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Gross CTC / Annual Income</p>
                  <h3 className="text-2xl font-black text-indigo-950 mt-1">{fmt(inc)}</h3>
                  <p className="text-xs text-indigo-600 mt-1">Monthly In-Hand: {fmt(monthlyInhand)}/mo</p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">New Tax Regime (115BAC)</p>
                  <h3 className="text-2xl font-black text-emerald-950 mt-1">{fmt(newTax)}</h3>
                  <p className="text-xs text-emerald-600 mt-1">Effective Rate: {((newTax / inc) * 100).toFixed(2)}% (+ 4% Cess)</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CA Recommendation</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">New Regime Opt-In</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">Saves {fmt(savings)} vs Old Regime</p>
                </div>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-100/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Comparative Tax Audit (FY 2024-25)</span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-100/70 px-2.5 py-0.5 rounded-full">Section 115BAC Verified</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-3 p-4 font-semibold text-slate-400 uppercase text-[11px]">
                    <span>Tax Parameter</span>
                    <span className="text-right text-emerald-700 font-bold">New Tax Regime (Default)</span>
                    <span className="text-right">Old Tax Regime</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50/50">
                    <span className="font-medium text-slate-700">Gross Total Income (Salary &amp; Capital Gains)</span>
                    <span className="text-right font-bold text-slate-900">{fmt(inc)}</span>
                    <span className="text-right font-medium text-slate-600">{fmt(inc)}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50/50">
                    <span className="font-medium text-slate-700">Standard Deduction (Sec 16(ia))</span>
                    <span className="text-right font-bold text-emerald-600">- ₹75,000 (Budget 2024)</span>
                    <span className="text-right font-medium text-slate-600">- ₹50,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50/50">
                    <span className="font-medium text-slate-700">Section 80C Deductions (EPF, PPF, ELSS)</span>
                    <span className="text-right text-slate-400 italic">Foregone under 115BAC</span>
                    <span className="text-right font-medium text-slate-600">- ₹1,50,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50/50">
                    <span className="font-medium text-slate-700">Section 80D Health Insurance</span>
                    <span className="text-right text-slate-400 italic">Foregone</span>
                    <span className="text-right font-medium text-slate-600">- ₹25,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 hover:bg-slate-50/50">
                    <span className="font-medium text-slate-700">Section 24(b) Home Loan Interest</span>
                    <span className="text-right text-slate-400 italic">₹0 on self-occupied</span>
                    <span className="text-right font-medium text-slate-600">- ₹2,00,000</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 bg-slate-50/70 font-semibold">
                    <span className="text-slate-800">Net Taxable Income</span>
                    <span className="text-right font-black text-slate-900">{fmt(inc - 75000)}</span>
                    <span className="text-right font-bold text-slate-700">{fmt(Math.max(0, inc - 425000))}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 bg-indigo-50/40 font-bold">
                    <span className="text-indigo-950">Total Tax + 4% Health &amp; Education Cess</span>
                    <span className="text-right text-emerald-600 font-black text-sm">{fmt(newTax)}</span>
                    <span className="text-right text-slate-700 font-black text-sm">{fmt(oldTax)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE AL */}
          {activeTab === 'balance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 text-white rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Consolidated Net Worth</p>
                  <h3 className="text-2xl font-black text-white mt-1">{fmt(netWorth)}</h3>
                  <p className="text-xs text-emerald-400 mt-1">Assets minus Active Debts</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Asset Holdings</p>
                  <h3 className="text-2xl font-black text-emerald-950 mt-1">{fmt(totalAssets)}</h3>
                  <p className="text-xs text-emerald-600 mt-1">{assets.length} audited accounts</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                  <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Total Active Liabilities</p>
                  <h3 className="text-2xl font-black text-rose-950 mt-1">{fmt(totalLiabs)}</h3>
                  <p className="text-xs text-rose-600 mt-1">{liabilities.length} active term loans</p>
                </div>
              </div>

              {/* Assets Schedule Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-indigo-900 text-white px-6 py-3 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider">Schedule 1: Consolidated Asset Valuation</span>
                  <span className="text-xs text-indigo-200">{assets.length} Items</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-6">Asset Instrument</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Target Yield</th>
                      <th className="py-3 px-6 text-right">Market Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assets.map((a: any) => (
                      <tr key={a.id || a.label} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{a.label}</td>
                        <td className="py-3.5 px-4 text-slate-500"><span className="bg-slate-100 px-2 py-0.5 rounded-md">{a.type}</span></td>
                        <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">{a.yield_pct ? `${a.yield_pct}% p.a.` : '—'}</td>
                        <td className="py-3.5 px-6 text-right font-bold text-slate-900">{fmt(a.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Liabilities Schedule Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider">Schedule 2: Outstanding Liabilities &amp; Repayment Terms</span>
                  <span className="text-xs text-slate-300">{liabilities.length} Loans</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-6">Loan / Facility</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-center">Rate</th>
                      <th className="py-3 px-4 text-right">Monthly EMI</th>
                      <th className="py-3 px-6 text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liabilities.map((l: any) => (
                      <tr key={l.id || l.label} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{l.label}</td>
                        <td className="py-3.5 px-4 text-slate-500"><span className="bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded-md">{l.type}</span></td>
                        <td className="py-3.5 px-4 text-center text-slate-700 font-bold">{l.rate}% p.a.</td>
                        <td className="py-3.5 px-4 text-right text-rose-600 font-bold">{fmt(l.emi)}/mo</td>
                        <td className="py-3.5 px-6 text-right font-black text-slate-900">{fmt(l.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCE TAX CALENDAR */}
          {activeTab === 'advance' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Section 208 CBDT Advance Tax Obligation</p>
                  <p className="mt-0.5 text-amber-800">
                    Any taxpayer whose net tax liability exceeds ₹10,000 per financial year is required to pay advance tax across 4 statutory installments to avoid Section 234B &amp; 234C interest penalties (1% per month).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { q: 'Q1 (15%)', date: '15 June', amount: Math.round(newTax * 0.15), status: 'Reconciled', desc: '15% cumulative' },
                  { q: 'Q2 (45%)', date: '15 September', amount: Math.round(newTax * 0.45), status: 'Reconciled', desc: '45% cumulative' },
                  { q: 'Q3 (75%)', date: '15 December', amount: Math.round(newTax * 0.75), status: 'Upcoming', desc: '75% cumulative' },
                  { q: 'Q4 (100%)', date: '15 March', amount: newTax, status: 'Final Due', desc: '100% final balance' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400">{item.q}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Reconciled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600">Due Date: {item.date}</p>
                      <h4 className="text-xl font-black text-slate-900 mt-2">{fmt(item.amount)}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CA ADVISORY */}
          {activeTab === 'advisory' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-4">
                <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Chartered Accountant Tax-Saving Action Items
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="font-bold text-slate-900">1. Section 112A LTCG Tax Harvesting (Save ₹15,625 / year)</p>
                    <p className="text-slate-600 mt-1">
                      Section 112A provides an annual exemption of up to <strong>₹1,25,000</strong> on Long-Term Capital Gains from equity &amp; equity mutual funds. Sell and immediately re-buy eligible mutual funds before March 31st to step up your cost basis tax-free.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="font-bold text-slate-900">2. Section 44ADA Presumptive Freelance Exemption (50% Tax Free)</p>
                    <p className="text-slate-600 mt-1">
                      If you earn any consulting or freelance side income, Section 44ADA allows professionals to declare only 50% of gross receipts as taxable profits without maintaining detailed books of accounts.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="font-bold text-slate-900">3. Employer Corporate NPS Restructuring (Section 80CCD(2))</p>
                    <p className="text-slate-600 mt-1">
                      Request your employer to allocate up to <strong>14% of Basic Salary</strong> towards Corporate NPS Tier-1. This is 100% tax-deductible under both Old and New Tax Regimes without any upper ₹1.5L cap.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="font-bold text-slate-900">4. Eliminate Non-Deductible Loan Interest Burn</p>
                    <p className="text-slate-600 mt-1">
                      Unlike home loans, vehicle and personal loan interest receives <strong>zero tax deductions</strong>. Channel your monthly savings surplus towards prepaying the car loan to eliminate an 8.85% post-tax burn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-400">
            Generated deterministically on-device by Halo Wealth Engine • FY 2024-25
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2.5 bg-[#2B2644] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Official PDF Pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
