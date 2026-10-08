import { useState, useEffect } from 'react'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import { useNavigate } from '../router'
import VoiceMicButton from '../components/VoiceMicButton'
import DocumentScanModal from '../components/DocumentScanModal'
import MoneyFlowVisualizer from '../components/MoneyFlowVisualizer'
import {
  Upload,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  CreditCard,
  Sliders,
  CheckCircle2
} from 'lucide-react'

const MOCK_DATA = [
  { name: 'Jan', val: 280 },
  { name: 'Feb', val: 295 },
  { name: 'Mar', val: 310 },
  { name: 'Apr', val: 325 },
  { name: 'May', val: 330 },
  { name: 'Jun', val: 338 },
  { name: 'Jul', val: 341 },
]

export default function Today() {
  const [query, setQuery] = useState('')
  const [score, setScore] = useState(850)
  const [summary, setSummary] = useState<any>(null)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [cibilSyncing, setCibilSyncing] = useState(false)
  const [cibilMsg, setCibilMsg] = useState<string | null>(null)

  // Interactive Future-Self Time Machine Age State
  const [age, setAge] = useState<number>(30)

  const navigate = useNavigate()

  const fetchSummary = () => {
    fetch('http://localhost:8000/api/wealth/summary')
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(console.error)
  }

  useEffect(() => {
    fetchSummary()
    fetch('http://localhost:8000/api/intelligence/halo-score')
      .then(r => r.json())
      .then(data => setScore(data.score))
      .catch(() => {})

    const handleUpdate = () => {
      fetchSummary()
    }
    window.addEventListener('halo:wealth_updated', handleUpdate)
    return () => window.removeEventListener('halo:wealth_updated', handleUpdate)
  }, [])

  const handleAsk = () => {
    if (!query.trim()) return
    navigate(`/tax-planning?q=${encodeURIComponent(query.trim())}`)
  }

  const handleVoiceTranscript = (text: string) => {
    setQuery(text)
  }

  const handleSyncCIBIL = async () => {
    setCibilSyncing(true)
    setCibilMsg(null)
    try {
      const res = await fetch('http://localhost:8000/api/wealth/import-cibil', { method: 'POST' })
      const data = await res.json()
      setCibilMsg(data.message)
      fetchSummary()
    } catch (e) {
      setCibilMsg('Failed to sync CIBIL report.')
    } finally {
      setCibilSyncing(false)
    }
  }

  const fmtCr = (val: number) => {
    if (!val) return '₹0'
    const cr = val / 10000000
    if (cr >= 1) return `₹${cr.toFixed(2)}Cr`
    const l = val / 100000
    return `₹${l.toFixed(1)}L`
  }

  // Future-Self Projection Calculation based on Age Slider
  const baseNetWorth = summary?.net_worth || 34100000
  const yearsDelta = age - 30
  // Assume 11% annual return on assets, loans amortizing to 0 by age 44
  const projectedNetWorth = Math.round(
    baseNetWorth * Math.pow(1.11, Math.max(0, yearsDelta)) +
    (yearsDelta > 0 ? yearsDelta * 1200000 : 0) // annual savings added
  )

  return (
    <div className="max-w-[88rem] mx-auto w-full px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, Advait 👋</h1>
          <p className="text-slate-500 mt-1">
            Offline-first financial intelligence cockpit. All computations 100% on-device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncCIBIL}
            disabled={cibilSyncing}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            title="Auto-sync loans from CIBIL/Experian without manual typing"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            {cibilSyncing ? 'Syncing Bureau...' : 'Auto-Sync CIBIL Loans'}
          </button>

          <button
            onClick={() => setIsScanOpen(true)}
            className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Scan CAS / Form 16
          </button>

          <div className="bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm flex items-center gap-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Halo Score</div>
            <div className="text-xl font-bold text-indigo-600">{score}</div>
          </div>
        </div>
      </div>

      {cibilMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {cibilMsg}
          </span>
          <button onClick={() => setCibilMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Net Worth Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consolidated Net Worth</p>
                <h2 className="text-4xl font-extrabold text-slate-900 mt-1">
                  {summary ? fmtCr(summary.net_worth) : '₹3.41Cr'}
                </h2>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Total Assets: {summary ? fmtCr(summary.total_assets) : '₹4.14Cr'} | Active Debt: {summary ? fmtCr(summary.total_liabilities) : '₹73.2L'}
                </p>
              </div>

              <button
                onClick={() => navigate('/wealth-engine')}
                className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2 hover:bg-slate-100 transition-colors"
              >
                Wealth Engine <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}L`, 'Net Worth']}
                  />
                  <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Future-Self Time Machine Slider */}
          <div className="mt-4 pt-4 border-t border-gray-100 bg-slate-50/70 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Future-Self Time Machine
              </span>
              <span className="text-xs font-extrabold text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-full shadow-2xs">
                Age {age} ➔ Projected {fmtCr(projectedNetWorth)}
              </span>
            </div>

            <input
              type="range"
              min={30}
              max={65}
              step={1}
              value={age}
              onChange={e => setAge(+e.target.value)}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Today (Age 30): {fmtCr(baseNetWorth)}</span>
              <span>Debt Free: Age 44</span>
              <span>Retirement (Age 65): {fmtCr(projectedNetWorth)}</span>
            </div>
          </div>
        </div>

        {/* Tax Liability Meter Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Meter &amp; Compliance</p>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">FY 2024-25</span>
            </div>

            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-44 h-22 overflow-hidden mb-2">
                <div className="absolute top-0 left-0 w-44 h-44 rounded-full border-[14px] border-slate-100"></div>
                <div className="absolute top-0 left-0 w-44 h-44 rounded-full border-[14px] border-indigo-600" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', transform: 'rotate(130deg)' }}></div>
              </div>
              <div className="-mt-12 text-center">
                <p className="text-[11px] text-slate-400 font-medium">Annual Tax Liability</p>
                <h3 className="text-2xl font-extrabold text-slate-900">₹1,09,200</h3>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="w-full bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Next Advance Tax:</span>
              <span className="font-bold text-slate-900">15 Sep (₹27,300)</span>
            </div>
            <button
              onClick={() => navigate('/tax-rules')}
              className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Audit Tax Slab Rules ↗
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Real-Time Money Flow Visualizer */}
      <div className="mb-8">
        <MoneyFlowVisualizer />
      </div>

      {/* Row 3: Tax Leakage Radar & Upcoming Compliance Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tax Leakage Radar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Tax Leakage Radar
              </h3>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                ₹68,125 Leaking
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Actionable deductions and exemptions unharvested for the current financial year.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Employer NPS under 80CCD(2)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Up to 14% of basic salary tax-exempt. Not configured in payroll.</p>
                </div>
                <span className="text-xs font-extrabold text-rose-600 shrink-0">₹52,500/yr</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Unharvested Section 112A LTCG</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">₹1.25L annual tax-free gains window resets on March 31.</p>
                </div>
                <span className="text-xs font-extrabold text-amber-600 shrink-0">₹15,625</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/tax-planning?q=How%20do%20I%20fix%20my%20tax%20leaks?')}
            className="mt-6 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            Ask Halo AI to draft payroll declaration ➔
          </button>
        </div>

        {/* Financial Compliance Calendar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Compliance &amp; Tax Deadlines
              </h3>
              <span className="text-xs text-slate-400 font-medium">CBDT &amp; RBI Schedule</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Never miss statutory penalty dates (Section 234B/C interest prevention).
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100/60">
                <div className="text-center font-bold text-indigo-600 shrink-0 w-12 text-xs">
                  <div className="text-[10px] uppercase font-semibold text-indigo-400">SEP</div>
                  <div className="text-base">15</div>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-indigo-950">Q2 Advance Tax Installment</p>
                  <p className="text-indigo-600 text-[11px]">Pay 45% of cumulative tax liability to avoid 1% monthly Sec 234C interest.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-center font-bold text-slate-600 shrink-0 w-12 text-xs">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">MAR</div>
                  <div className="text-base">31</div>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">FY 2024-25 Tax Year Closes</p>
                  <p className="text-slate-500 text-[11px]">Last date for 80C investments, SGB tax-loss harvesting, and PPF deposits.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/what-if')}
            className="mt-6 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            Simulate Advance Tax in What-If Cockpit ➔
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex gap-4 mb-24 overflow-x-auto pb-4">
        <button
          onClick={() => setIsScanOpen(true)}
          className="whitespace-nowrap px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Scan CAS / Form 16 / CSV
        </button>

        <button
          onClick={() => navigate('/what-if')}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-2xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" /> What-If Life Simulators
        </button>

        <button
          onClick={() => navigate('/wealth-engine')}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Manage Assets &amp; Loans
        </button>

        <button
          onClick={() => navigate('/calculators')}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Tax Calculators
        </button>

        <button
          onClick={() => {
            fetch('http://localhost:8000/api/wealth/reset', { method: 'POST' })
              .then(fetchSummary)
          }}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-medium rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Portfolio Seed
        </button>
      </div>

      {/* Sticky AI Chat with Voice Recognition */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
            ✨
          </div>

          <input 
            type="text" 
            placeholder="Ask or speak in Hinglish (e.g. 'Bhai 20L car loan add karo', 'Open what if')..." 
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base py-3 px-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk() }}
          />

          <VoiceMicButton onTranscript={handleVoiceTranscript} />

          <button 
            onClick={handleAsk}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors shrink-0"
          >
            Ask Halo
          </button>
        </div>
      </div>

      <DocumentScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          setIsScanOpen(false)
          fetchSummary()
        }}
      />
    </div>
  )
}
