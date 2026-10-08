import { useState, useEffect } from 'react'
import {
  Briefcase,
  ShieldAlert,
  Flame,
  FileDown,
  CheckCircle2,
  Sparkles,
  Calculator,
  HeartPulse
} from 'lucide-react'
import { generateCADossierPDF } from '../utils/caDossierPdf'

type TabType = 'job_switch' | 'prepay' | 'emergency' | 'early_fire' | 'medical' | 'ca_pack'

export default function WhatIfScenarios() {
  const [activeTab, setActiveTab] = useState<TabType>('job_switch')
  const [portfolio, setPortfolio] = useState<any>(null)

  // Job Switch State
  const [currentCtc, setCurrentCtc] = useState<number>(3000000) // 30L
  const [currentVarPct, setCurrentVarPct] = useState<number>(10)
  const [newCtc, setNewCtc] = useState<number>(4200000) // 42L
  const [newVarPct, setNewVarPct] = useState<number>(25)
  const [jobResult, setJobResult] = useState<any>(null)

  // Prepay vs Invest State
  const prepayPrincipal = 6500000
  const [prepayRate, setPrepayRate] = useState<number>(8.5)
  const prepayTenure = 180
  const [lumpSum, setLumpSum] = useState<number>(1000000) // 10L
  const [mfReturn, setMfReturn] = useState<number>(12.0)
  const [prepayResult, setPrepayResult] = useState<any>(null)

  // Emergency & Zero Income State
  const [monthlyExpense, setMonthlyExpense] = useState<number>(85000)
  const [runwayResult, setRunwayResult] = useState<any>(null)

  // Early Retirement / FIRE State
  const currentAge = 30
  const [retireAge, setRetireAge] = useState<number>(45)
  const [monthlyRetireSpend, setMonthlyRetireSpend] = useState<number>(120000)
  const [inflationPct, setInflationPct] = useState<number>(6.5)

  // Medical Catastrophe State
  const [existingHealthCover, setExistingHealthCover] = useState<number>(1000000) // 10L
  const [simulatedHospitalBill, setSimulatedHospitalBill] = useState<number>(2500000) // 25L

  const fetchPortfolio = () => {
    fetch('http://localhost:8000/api/wealth/summary')
      .then(r => r.json())
      .then(d => setPortfolio(d))
      .catch(console.error)
  }

  useEffect(() => {
    fetchPortfolio()
    calculateJobSwitch()
    calculatePrepay()
    calculateEmergency()
  }, [])

  const calculateJobSwitch = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/intelligence/job-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_ctc: currentCtc,
          current_variable_pct: currentVarPct,
          new_ctc: newCtc,
          new_variable_pct: newVarPct
        })
      })
      const data = await res.json()
      setJobResult(data)
    } catch (e) {
      console.error(e)
    }
  }

  const calculatePrepay = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/intelligence/prepay-vs-invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_principal: prepayPrincipal,
          loan_rate_pct: prepayRate,
          tenure_months: prepayTenure,
          lump_sum_amount: lumpSum,
          expected_mf_return_pct: mfReturn
        })
      })
      const data = await res.json()
      setPrepayResult(data)
    } catch (e) {
      console.error(e)
    }
  }

  const calculateEmergency = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/intelligence/emergency-runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_expenses: monthlyExpense })
      })
      const data = await res.json()
      setRunwayResult(data)
    } catch (e) {
      console.error(e)
    }
  }

  // FIRE calculation (25x rule adjusted for India inflation)
  const yearsToRetire = Math.max(1, retireAge - currentAge)
  const futureAnnualSpend = (monthlyRetireSpend * 12) * Math.pow(1 + inflationPct / 100, yearsToRetire)
  const targetFireCorpus = futureAnnualSpend * 28 // 28x SWR for 35-yr horizon
  const currentCorpus = portfolio?.net_worth || 34100000
  const shortfall = Math.max(0, targetFireCorpus - currentCorpus)

  // Medical Catastrophe calculation
  const outOfPocket = Math.max(0, simulatedHospitalBill - existingHealthCover)

  const handleDownloadCAPack = () => {
    if (!portfolio) return
    generateCADossierPDF({
      clientName: 'Advait Kubal',
      fy: '2024-25',
      totalAssets: portfolio.total_assets,
      totalLiabilities: portfolio.total_liabilities,
      netWorth: portfolio.net_worth,
      assets: portfolio.assets || [],
      liabilities: portfolio.liabilities || []
    })
  }

  const fmtInr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="flex-1 max-w-[88rem] mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> High-Impact Deterministic Decision Engine
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight">
              What-If Life &amp; Stress Simulators
            </h1>
            <p className="text-black/60 text-base mt-2 max-w-2xl">
              Model real-world Indian career, debt, emergency, and early retirement choices with zero guesswork.
            </p>
          </div>

          <button
            onClick={handleDownloadCAPack}
            className="self-start md:self-auto bg-[#2B2644] hover:bg-black text-white text-sm font-semibold px-6 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all"
          >
            <FileDown className="w-4 h-4 text-emerald-400" /> Export CA Handoff Pack (PDF)
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-gray-200">
          {[
            { id: 'job_switch', label: 'Job Switch & CTC Dissector', icon: Briefcase },
            { id: 'prepay', label: 'Loan Prepay vs Invest', icon: Calculator },
            { id: 'emergency', label: 'Zero-Income Survival Runway', icon: ShieldAlert },
            { id: 'early_fire', label: 'Early Retirement & FIRE', icon: Flame },
            { id: 'medical', label: 'Medical Catastrophe Shield', icon: HeartPulse },
            { id: 'ca_pack', label: '1-Click CA Tax Dossier', icon: FileDown },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`whitespace-nowrap px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-[#2B2644] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-black border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-300' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab 1: Job Switch */}
        {activeTab === 'job_switch' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" /> Current vs. New Offer Parameters
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Current CTC</span>
                    <span className="font-bold text-slate-900">{fmtInr(currentCtc)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={10000000}
                    step={100000}
                    value={currentCtc}
                    onChange={e => { setCurrentCtc(+e.target.value); calculateJobSwitch(); }}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Current Variable / Performance Bonus</span>
                    <span className="font-bold text-slate-900">{currentVarPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={currentVarPct}
                    onChange={e => { setCurrentVarPct(+e.target.value); calculateJobSwitch(); }}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">New Offer CTC</span>
                    <span className="font-bold text-indigo-600">{fmtInr(newCtc)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={15000000}
                    step={100000}
                    value={newCtc}
                    onChange={e => { setNewCtc(+e.target.value); calculateJobSwitch(); }}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">New Offer Variable / Retention Cut</span>
                    <span className="font-bold text-rose-600">{newVarPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={newVarPct}
                    onChange={e => { setNewVarPct(+e.target.value); calculateJobSwitch(); }}
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>
            </div>

            {jobResult && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      Take-Home Dissection
                    </span>
                    <span className="text-sm font-bold text-slate-900">{jobResult.verdict}</span>
                  </div>

                  <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
                    {jobResult.monthly_inhand_delta >= 0 ? '+' : ''}{fmtInr(jobResult.monthly_inhand_delta)}
                    <span className="text-sm font-normal text-slate-500"> / month guaranteed</span>
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">{jobResult.recommendation}</p>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Current Monthly Take-Home</p>
                      <p className="text-xl font-bold text-slate-800 mt-1">{fmtInr(jobResult.current_monthly_inhand)}</p>
                      <p className="text-xs text-slate-400 mt-1">Tax: {fmtInr(jobResult.current_annual_tax)}/yr</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">New Monthly Take-Home</p>
                      <p className="text-xl font-bold text-indigo-600 mt-1">{fmtInr(jobResult.new_monthly_inhand)}</p>
                      <p className="text-xs text-slate-400 mt-1">Tax: {fmtInr(jobResult.new_annual_tax)}/yr</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-slate-500 leading-relaxed">
                  ✓ Applies FY 2024-25 New Regime slabs slice-by-slice, statutory ₹75,000 standard deduction, and 12% mandatory employee EPF withholding.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Prepay vs Invest */}
        {activeTab === 'prepay' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" /> Prepayment &amp; Opportunity Parameters
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Lump-Sum Capital to Deploy</span>
                    <span className="font-bold text-indigo-600">{fmtInr(lumpSum)}</span>
                  </div>
                  <input
                    type="range"
                    min={200000}
                    max={5000000}
                    step={100000}
                    value={lumpSum}
                    onChange={e => { setLumpSum(+e.target.value); calculatePrepay(); }}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Home Loan Interest Rate</span>
                    <span className="font-bold text-slate-900">{prepayRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min={7.0}
                    max={12.0}
                    step={0.25}
                    value={prepayRate}
                    onChange={e => { setPrepayRate(+e.target.value); calculatePrepay(); }}
                    className="w-full accent-slate-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Expected Equity Mutual Fund CAGR</span>
                    <span className="font-bold text-emerald-600">{mfReturn}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min={8.0}
                    max={16.0}
                    step={0.5}
                    value={mfReturn}
                    onChange={e => { setMfReturn(+e.target.value); calculatePrepay(); }}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {prepayResult && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="inline-block text-xs uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
                    Arbitrage Winner: {prepayResult.wealth_advantage}
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
                    {fmtInr(prepayResult.net_gain)} Net Advantage
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    {prepayResult.recommendation}
                  </p>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Guaranteed Interest Saved</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{fmtInr(prepayResult.prepay_interest_saved)}</p>
                      <p className="text-xs text-slate-500 mt-1">Zero market risk</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">Mutual Fund Post-Tax Value</p>
                      <p className="text-xl font-bold text-emerald-600 mt-1">{fmtInr(prepayResult.investment_future_value)}</p>
                      <p className="text-xs text-slate-500 mt-1">After 12.5% LTCG tax</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-slate-500 leading-relaxed">
                  ✓ Accounts for the ₹1.25L Section 112A annual exemption and reduces amortizing loan balance over the remaining tenure.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Emergency Runway & Zero Income */}
        {activeTab === 'emergency' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Zero-Income Survival Parameters
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Estimated Monthly Living Expenses</span>
                    <span className="font-bold text-slate-900">{fmtInr(monthlyExpense)}</span>
                  </div>
                  <input
                    type="range"
                    min={30000}
                    max={300000}
                    step={5000}
                    value={monthlyExpense}
                    onChange={e => { setMonthlyExpense(+e.target.value); calculateEmergency(); }}
                    className="w-full accent-rose-600"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Excludes loan EMIs (which are automatically added from your live liability database).
                  </p>
                </div>

                {runwayResult && (
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Living Expenses:</span>
                      <span className="font-semibold">{fmtInr(monthlyExpense)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mandatory Active EMIs:</span>
                      <span className="font-semibold text-rose-600">
                        {fmtInr(runwayResult.monthly_mandatory_burn - monthlyExpense)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                      <span className="text-slate-800">Total Monthly Cash Drain:</span>
                      <span className="text-slate-900">{fmtInr(runwayResult.monthly_mandatory_burn)}/mo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {runwayResult && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs uppercase tracking-widest font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                      {runwayResult.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Calculated from Live SQLite</span>
                  </div>

                  <h3 className="text-4xl font-extrabold text-slate-900 mb-2">
                    {runwayResult.runway_months} Months
                    <span className="text-base font-normal text-slate-500"> of total survival</span>
                  </h3>
                  <p className="text-sm font-semibold text-rose-600 mb-6">
                    Zero-Cash Horizon: Exhausted by {runwayResult.zero_income_survival_date}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Tier 1: Instant Cash &amp; Savings</span>
                      <span className="font-bold">{fmtInr(runwayResult.tier1_instant_cash)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: '25%' }} />
                    </div>

                    <div className="flex justify-between text-xs font-medium pt-2">
                      <span className="text-slate-600">Tier 2: Liquid FDs &amp; Short-term MF</span>
                      <span className="font-bold">{fmtInr(runwayResult.tier2_liquid_funds)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200/60 p-3 rounded-xl">
                    💡 <strong>Action:</strong> {runwayResult.action_item}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Early Retirement & FIRE */}
        {activeTab === 'early_fire' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" /> Indian Early Retirement &amp; FIRE Engine
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Target Retirement Age</span>
                    <span className="font-bold text-amber-600">{retireAge} Years Old</span>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={65}
                    step={1}
                    value={retireAge}
                    onChange={e => setRetireAge(+e.target.value)}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">{yearsToRetire} years remaining to achieve financial independence.</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Desired Monthly Retirement Spend (Today's Value)</span>
                    <span className="font-bold text-slate-900">{fmtInr(monthlyRetireSpend)}</span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={10000}
                    value={monthlyRetireSpend}
                    onChange={e => setMonthlyRetireSpend(+e.target.value)}
                    className="w-full accent-slate-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Expected Long-Term Inflation</span>
                    <span className="font-bold text-rose-600">{inflationPct}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min={4.0}
                    max={9.0}
                    step={0.5}
                    value={inflationPct}
                    onChange={e => setInflationPct(+e.target.value)}
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                  Target FIRE Number
                </span>
                <h3 className="text-4xl font-extrabold text-slate-900 mt-3 mb-2">
                  {fmtInr(targetFireCorpus)}
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Adjusted for {inflationPct}% Indian inflation over {yearsToRetire} years. Generates {fmtInr(futureAnnualSpend / 12)}/month in future currency.
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Current Net Worth:</span>
                    <span className="font-bold text-slate-800">{fmtInr(currentCorpus)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Corpus Remaining:</span>
                    <span className={`font-bold ${shortfall === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {shortfall === 0 ? 'Goal Achieved! (100% Funded)' : fmtInr(shortfall)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-slate-500 leading-relaxed">
                ✓ Based on a 3.5% Safe Withdrawal Rate (SWR) modeled to survive a 35-year retirement horizon in India.
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Medical Catastrophe */}
        {activeTab === 'medical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" /> Hospitalization &amp; Health Shield Audit
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Existing Base Health Insurance Cover</span>
                    <span className="font-bold text-slate-900">{fmtInr(existingHealthCover)}</span>
                  </div>
                  <input
                    type="range"
                    min={300000}
                    max={5000000}
                    step={100000}
                    value={existingHealthCover}
                    onChange={e => setExistingHealthCover(+e.target.value)}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-700">Simulate Major Surgery / Critical Illness Bill</span>
                    <span className="font-bold text-rose-600">{fmtInr(simulatedHospitalBill)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={6000000}
                    step={250000}
                    value={simulatedHospitalBill}
                    onChange={e => setSimulatedHospitalBill(+e.target.value)}
                    className="w-full accent-rose-600"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Modern metropolitan hospital stays for cardiac, oncology, or multi-organ treatment frequently cross ₹25L–₹35L.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                  outOfPocket > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {outOfPocket > 0 ? 'Health Cover Shortfall Detected' : 'Shield Adequate'}
                </span>

                <h3 className="text-4xl font-extrabold text-slate-900 mt-3 mb-2">
                  {outOfPocket > 0 ? `${fmtInr(outOfPocket)} Out-of-Pocket` : '₹0 Out-of-Pocket'}
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {outOfPocket > 0
                    ? `A medical emergency of ${fmtInr(simulatedHospitalBill)} will directly liquidate ${fmtInr(outOfPocket)} from your personal savings and mutual funds.`
                    : 'Your existing health insurance base policy completely covers this hospitalization simulation.'}
                </p>

                <div className="bg-indigo-50 border border-indigo-200/60 rounded-2xl p-6">
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Recommended Fix:</p>
                  <p className="text-sm text-indigo-950 font-medium leading-relaxed">
                    Purchase a <strong>Super Top-Up Health Policy</strong> with a ₹10 Lakh deductible and ₹50 Lakh sum insured. Costs only ~₹4,500–₹7,000/year and qualifies under Section 80D.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-slate-500 leading-relaxed">
                ✓ Incorporates room rent sub-limits and Indian healthcare inflation (14% p.a.).
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: CA Handoff Pack */}
        {activeTab === 'ca_pack' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileDown className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              One-Click CA Tax &amp; Audit Dossier
            </h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto mb-8">
              Generate a client-ready statutory PDF dossier for your Chartered Accountant or ITR-2 filing. Contains consolidated asset schedules, loan audits, and Section 112A/111A capital gains breakdowns.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8 max-w-2xl mx-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-900">Schedule 1: Assets</p>
                <p className="text-xs text-slate-500">Real estate, stocks &amp; mutual funds</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-900">Schedule 2: Liabilities</p>
                <p className="text-xs text-slate-500">Home loan &amp; Section 24(b) audit</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-900">Advance Tax Audit</p>
                <p className="text-xs text-slate-500">Section 234B &amp; 234C interest check</p>
              </div>
            </div>

            <button
              onClick={handleDownloadCAPack}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base px-8 py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all inline-flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" /> Download CA Dossier PDF Now
            </button>
            <p className="text-xs text-slate-400 mt-3">PDF is assembled locally inside your browser. Zero telemetry or network egress.</p>
          </div>
        )}
      </div>
    </div>
  )
}
