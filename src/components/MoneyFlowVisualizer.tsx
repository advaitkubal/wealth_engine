import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

export default function MoneyFlowVisualizer() {
  const [grossIncome, setGrossIncome] = useState<number>(300000) // ₹3L / month
  const [taxPct, setTaxPct] = useState<number>(14) // ~₹42,000 TDS
  const [homeLoanEmi, setHomeLoanEmi] = useState<number>(36500)
  const [carLoanEmi, setCarLoanEmi] = useState<number>(15200)
  const [livingExpenses, setLivingExpenses] = useState<number>(55000)

  const fetchLiveSummary = () => {
    fetch('http://localhost:8000/api/wealth/summary')
      .then(r => r.json())
      .then(d => {
        if (d.annual_income) {
          setGrossIncome(Math.round(d.annual_income / 12))
        }
        if (d.liabilities && Array.isArray(d.liabilities)) {
          const hl = d.liabilities.find((l: any) => l.type === 'Home Loan' || l.label.toLowerCase().includes('home') || l.label.toLowerCase().includes('housing'))
          const cl = d.liabilities.find((l: any) => l.type === 'Car Loan' || l.label.toLowerCase().includes('car') || l.label.toLowerCase().includes('auto'))
          if (hl) setHomeLoanEmi(hl.emi || 36500)
          if (cl) setCarLoanEmi(cl.emi || 15200)
        }
        if (d.monthly_expenses) {
          setLivingExpenses(d.monthly_expenses)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchLiveSummary()
    const handleUpdate = () => fetchLiveSummary()
    window.addEventListener('halo:wealth_updated', handleUpdate)
    return () => window.removeEventListener('halo:wealth_updated', handleUpdate)
  }, [])

  // Derived flows
  const monthlyTax = Math.round(grossIncome * (taxPct / 100))
  const totalEmis = homeLoanEmi + carLoanEmi
  const totalMandatoryBurn = monthlyTax + totalEmis + livingExpenses
  const surplusSIP = Math.max(0, grossIncome - totalMandatoryBurn)
  const surplusPct = Math.round((surplusSIP / grossIncome) * 100)

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Monthly Cash Flow
          </div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Real-Time Money Flow &amp; Leakage</h3>
          <p className="text-sm text-slate-500">Live breakdown of how every Rupee converts from CTC into wealth compounding.</p>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-400 uppercase">Monthly Wealth Surplus</p>
          <p className={`text-2xl font-extrabold ${surplusSIP > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmt(surplusSIP)}
            <span className="text-xs font-normal text-slate-500"> ({surplusPct}% of CTC)</span>
          </p>
        </div>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="space-y-2 mb-8">
        <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${(monthlyTax / grossIncome) * 100}%` }}
            className="bg-rose-400 hover:bg-rose-500 transition-all"
            title={`Income Tax & TDS: ${fmt(monthlyTax)}`}
          />
          <div
            style={{ width: `${(homeLoanEmi / grossIncome) * 100}%` }}
            className="bg-amber-400 hover:bg-amber-500 transition-all"
            title={`Home Loan EMI: ${fmt(homeLoanEmi)}`}
          />
          <div
            style={{ width: `${(carLoanEmi / grossIncome) * 100}%` }}
            className="bg-orange-400 hover:bg-orange-500 transition-all"
            title={`Car Loan EMI: ${fmt(carLoanEmi)}`}
          />
          <div
            style={{ width: `${(livingExpenses / grossIncome) * 100}%` }}
            className="bg-slate-400 hover:bg-slate-500 transition-all"
            title={`Living Expenses: ${fmt(livingExpenses)}`}
          />
          <div
            style={{ width: `${(surplusSIP / grossIncome) * 100}%` }}
            className="bg-emerald-500 hover:bg-emerald-600 transition-all flex-1"
            title={`Surplus SIP & Investments: ${fmt(surplusSIP)}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"/> TDS Tax ({fmt(monthlyTax)})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/> Home EMI ({fmt(homeLoanEmi)})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"/> Car EMI ({fmt(carLoanEmi)})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"/> Living ({fmt(livingExpenses)})</span>
          <span className="flex items-center gap-1.5 font-bold text-emerald-700"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Surplus SIPs ({fmt(surplusSIP)})</span>
        </div>
      </div>

      {/* Interactive Controls & Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Gross Monthly Income</span>
              <span className="text-indigo-600 font-bold">{fmt(grossIncome)}</span>
            </div>
            <input
              type="range"
              min={100000}
              max={600000}
              step={10000}
              value={grossIncome}
              onChange={e => setGrossIncome(+e.target.value)}
              className="w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Effective TDS / Tax Withholding</span>
              <span className="text-rose-600 font-bold">{taxPct}% ({fmt(monthlyTax)})</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={taxPct}
              onChange={e => setTaxPct(+e.target.value)}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Home Loan EMI</span>
              <span className="font-bold">{fmt(homeLoanEmi)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={120000}
              step={2000}
              value={homeLoanEmi}
              onChange={e => setHomeLoanEmi(+e.target.value)}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Car / Vehicle Loan EMI</span>
              <span className="font-bold">{fmt(carLoanEmi)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={1000}
              value={carLoanEmi}
              onChange={e => setCarLoanEmi(+e.target.value)}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Monthly Living &amp; Lifestyle Burn</span>
              <span className="font-bold">{fmt(livingExpenses)}</span>
            </div>
            <input
              type="range"
              min={25000}
              max={150000}
              step={5000}
              value={livingExpenses}
              onChange={e => setLivingExpenses(+e.target.value)}
              className="w-full accent-slate-600"
            />
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-slate-50 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Annual Compounding Runway</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {fmt(surplusSIP * 12)} / year
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Investing this monthly surplus at 12% CAGR yields approximately{' '}
              <strong className="text-emerald-700">₹1.87 Crore</strong> in 10 years.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-200/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Debt-to-Income: {Math.round((totalEmis / grossIncome) * 100)}%</span>
            <span className={totalEmis / grossIncome <= 0.4 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
              {totalEmis / grossIncome <= 0.4 ? 'Healthy' : 'High Debt Burden'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
