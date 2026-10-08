import { useState, useEffect, useRef } from 'react'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import { useNavigate } from '../router'
import VoiceMicButton from '../components/VoiceMicButton'
import DocumentScanModal from '../components/DocumentScanModal'
import DebtIngestionModal from '../components/DebtIngestionModal'
import MoneyFlowVisualizer from '../components/MoneyFlowVisualizer'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  CreditCard,
  Sliders,
  CheckCircle2,
  Send,
  X,
  Trash2,
  Plus
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

interface TaxComplianceStatus {
  fy: string
  annual_income: number
  new_regime_tax: number
  old_regime_tax: number
  recommended_regime: string
  standard_deduction: number
  effective_rate_pct: number
  q1_due: number
  q2_due: number
  q3_due: number
  q4_due: number
  next_installment_date: string
  next_installment_amount: number
  sec_234c_status: string
  compliance_score_pct: number
  active_exemptions: string[]
}

interface Msg {
  role: 'user' | 'ai'
  text: string
  wealth_action?: boolean
  suggestions?: string[]
}

const STORAGE_KEY_MSGS = 'halo_chat_msgs'
const STORAGE_KEY_CONV = 'halo_chat_conv_id'

const WELCOME: Msg = {
  role: 'ai',
  text: `Hi Advait! I'm Halo, your on-device AI wealth assistant 👋\n\nI have direct access to your live portfolio database. Ask me anything or command portfolio changes directly:\n\n• **"Change homeloan to 40 lakhs"**\n• **"Add 15L mutual funds"**\n• **"Prepay 5L from car loan"**\n• **"What is my tax liability under New Regime?"**`,
  suggestions: ['Change homeloan to 40 lakhs', 'What is my current net worth?', 'Add 15L Mutual Funds', 'Optimize Section 80C'],
}

function loadMsgs(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MSGS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [WELCOME]
}

export default function Today() {
  const [query, setQuery] = useState('')
  const [score, setScore] = useState(850)
  const [summary, setSummary] = useState<any>(null)
  const [taxCompliance, setTaxCompliance] = useState<TaxComplianceStatus | null>(null)
  const [selectedFy, setSelectedFy] = useState<string>('2024-25')
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)
  const [cibilMsg, setCibilMsg] = useState<string | null>(null)

  // Interactive Future-Self Time Machine Age State
  const [age, setAge] = useState<number>(30)

  // Side Chat Copilot State
  const [msgs, setMsgs] = useState<Msg[]>(loadMsgs)
  const [convId, setConvId] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY_CONV) || undefined
  )
  const [thinking, setThinking] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [sideInput, setSideInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(msgs))
  }, [msgs])

  useEffect(() => {
    if (convId) localStorage.setItem(STORAGE_KEY_CONV, convId)
  }, [convId])

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [msgs, thinking, isChatOpen])

  const fetchSummary = () => {
    fetch('http://localhost:8000/api/wealth/summary')
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(console.error)
  }

  const fetchTaxCompliance = (fyParam = selectedFy) => {
    fetch(`http://localhost:8000/api/tax/compliance-summary?income=2400000&fy=${fyParam}`)
      .then(r => r.json())
      .then(data => setTaxCompliance(data))
      .catch(console.error)
  }

  useEffect(() => {
    fetchSummary()
    fetchTaxCompliance(selectedFy)
    fetch('http://localhost:8000/api/intelligence/halo-score')
      .then(r => r.json())
      .then(data => setScore(data.score))
      .catch(() => {})

    const handleUpdate = () => {
      fetchSummary()
      fetchTaxCompliance(selectedFy)
    }
    window.addEventListener('halo:wealth_updated', handleUpdate)
    return () => window.removeEventListener('halo:wealth_updated', handleUpdate)
  }, [selectedFy])

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY_MSGS)
    localStorage.removeItem(STORAGE_KEY_CONV)
    setMsgs([WELCOME])
    setConvId(undefined)
  }

  const sendMsg = async (text: string) => {
    if (!text.trim() || thinking) return
    const cleaned = text.trim()
    setIsChatOpen(true)
    setMsgs(m => [...m, { role: 'user', text: cleaned }])
    setThinking(true)

    // Handle UI navigation commands directly
    const lower = cleaned.toLowerCase()
    if (lower.includes('open wealth engine') || lower.includes('go to wealth engine')) {
      setTimeout(() => {
        setThinking(false)
        setMsgs(m => [...m, { role: 'ai', text: 'Opening your Wealth Engine dashboard now! 🚀' }])
        navigate('/wealth-engine')
      }, 300)
      return
    }
    if (lower.includes('open what if') || lower.includes('what if') || lower.includes('open scenarios')) {
      setTimeout(() => {
        setThinking(false)
        setMsgs(m => [...m, { role: 'ai', text: 'Opening What-If Life Decision Simulators! 🔀' }])
        navigate('/what-if')
      }, 300)
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleaned, conversation_id: convId }),
      })

      const data = await response.json()
      if (data.conversation_id) setConvId(data.conversation_id)

      const toolsExecuted: string[] = data.executed_tools || []
      const isWealthAction = toolsExecuted.some((t: string) =>
        ['add_asset', 'update_asset', 'delete_asset', 'add_liability', 'update_liability', 'delete_liability'].includes(t)
      )

      if (isWealthAction) {
        // Automatically updates dashboard everywhere!
        fetchSummary()
        fetchTaxCompliance()
        window.dispatchEvent(new CustomEvent('halo:wealth_updated'))
      }

      setMsgs(m => [...m, {
        role: 'ai',
        text: data.answer || "I have processed your request.",
        wealth_action: isWealthAction,
        suggestions: isWealthAction
          ? ['What is my updated net worth?', 'Show real-time money flow', 'Audit my tax liability']
          : undefined,
      }])
    } catch {
      setMsgs(m => [...m, {
        role: 'ai',
        text: 'Error connecting to the AI backend. Please ensure the local backend server is running.',
      }])
    } finally {
      setThinking(false)
    }
  }

  const handleAsk = () => {
    if (!query.trim()) return
    const textToSend = query.trim()
    setQuery('')
    sendMsg(textToSend)
  }

  const handleVoiceTranscript = (text: string) => {
    setQuery(text)
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
    <div className="max-w-[96rem] mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex gap-6 items-start relative w-full">
        {/* Main Dashboard Column — smoothly shifts left when copilot is open */}
        <div className={`transition-all duration-300 min-w-0 ${isChatOpen ? 'flex-1 max-w-full lg:max-w-[calc(100%-420px)] xl:max-w-[calc(100%-460px)]' : 'w-full'}`}>
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
            onClick={() => setIsDebtModalOpen(true)}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            title="Auto-sync loans from CIBIL/Experian & Account Aggregator without manual typing"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Link Loans (CIBIL / AA Sync)</span>
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
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Meter &amp; Compliance</p>
              <button
                onClick={() => setSelectedFy(f => f === '2024-25' ? '2025-26' : '2024-25')}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1"
                title="Click to toggle FY rule year"
              >
                FY {selectedFy} ⟳
              </button>
            </div>

            {/* Dynamic SVG Semi-Circle Gauge */}
            <div className="flex flex-col items-center justify-center my-3">
              <div className="relative w-48 h-26 flex flex-col items-center justify-end">
                <svg viewBox="0 0 160 90" className="w-48 h-28 overflow-visible">
                  <defs>
                    <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                  {/* Background Track */}
                  <path
                    d="M 15 80 A 65 65 0 0 1 145 80"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Active Value Arc */}
                  <path
                    d="M 15 80 A 65 65 0 0 1 145 80"
                    fill="none"
                    stroke="url(#meterGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="204.2"
                    strokeDashoffset={204.2 * (1 - Math.min(1, Math.max(0.05, (taxCompliance?.effective_rate_pct || 12.19) / 30)))}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute bottom-1 text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Annual Tax Liability</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    ₹{(taxCompliance?.new_regime_tax || 292500).toLocaleString('en-IN')}
                  </h3>
                  <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5">
                    {taxCompliance?.effective_rate_pct || 12.19}% Effective Rate
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            {/* Regime recommendation pill */}
            <div className="bg-emerald-50/90 border border-emerald-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider leading-none">
                  Recommended
                </span>
                <span className="text-emerald-950 font-bold text-xs truncate block mt-0.5">
                  {taxCompliance?.recommended_regime || 'New Regime (Budget 2024)'}
                </span>
              </div>
              <div className="text-right shrink-0 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                <span className="text-[10px] text-emerald-700 block font-medium leading-none">Saves</span>
                <span className="text-emerald-900 font-black text-xs">
                  ₹{((taxCompliance?.old_regime_tax || 530400) - (taxCompliance?.new_regime_tax || 292500)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Next Advance Tax:</span>
              <span className="font-bold text-slate-900">
                {taxCompliance?.next_installment_date || '15 Dec'} (₹{(taxCompliance?.next_installment_amount || 87750).toLocaleString('en-IN')})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {taxCompliance?.sec_234c_status || 'Compliant (0 Penalty)'}
              </span>
              <button
                onClick={() => navigate('/tax-rules')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Audit Slabs ↗
              </button>
            </div>
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
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {taxCompliance?.compliance_score_pct || 95}% Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              CBDT statutory advance tax schedule &amp; Section 234C interest penalty mitigation.
            </p>

            {/* Advance Tax Installment Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">15 Jun (15%)</p>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">₹{(taxCompliance?.q1_due || 43875).toLocaleString('en-IN')}</p>
                <span className="inline-block text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full mt-1">Paid</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">15 Sep (45%)</p>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">₹{(taxCompliance?.q2_due || 131625).toLocaleString('en-IN')}</p>
                <span className="inline-block text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full mt-1">Paid</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center ring-2 ring-indigo-500/20">
                <p className="text-[10px] uppercase font-bold text-indigo-600">15 Dec (75%)</p>
                <p className="text-xs font-extrabold text-indigo-950 mt-0.5">₹{(taxCompliance?.q3_due || 219375).toLocaleString('en-IN')}</p>
                <span className="inline-block text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-full mt-1">Due Next</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">15 Mar (100%)</p>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">₹{(taxCompliance?.q4_due || 292500).toLocaleString('en-IN')}</p>
                <span className="inline-block text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full mt-1">Upcoming</span>
              </div>
            </div>

            {/* Active Deductions & Exemptions recognized by pure engine */}
            <div className="space-y-1.5 mt-2">
              {(taxCompliance?.active_exemptions || [
                '₹75,000 Standard Deduction (Budget 2024)',
                'Section 87A Marginal Relief Slabs',
                '4% Health & Education Cess Reconciled'
              ]).map((exemption, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{exemption}</span>
                </div>
              ))}
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

      </div>

        {/* Right Side Chat Panel on Today's Page with Smooth Animation */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-[420px] xl:w-[460px] shrink-0 sticky top-20 bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col h-[calc(100vh-6rem)] overflow-hidden z-30"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Halo AI Copilot</h3>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      100% on-device • Live DB execution
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={clearChat}
                    className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1 shadow-2xs"
                    title="Start a new conversation"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Clear messages"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Close side chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {msgs.map((m, idx) => (
                m.role === 'user' ? (
                  <div key={idx} className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-xs leading-relaxed shadow-sm whitespace-pre-wrap">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5">
                      ✨
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-3 text-xs text-slate-800 leading-relaxed shadow-2xs">
                        <div className="space-y-1">
                          {m.text.split('\n').map((line, li) => {
                            if (line.startsWith('**') && line.endsWith('**'))
                              return <p key={li} className="font-bold text-slate-900">{line.replace(/\*\*/g, '')}</p>
                            if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
                              return <p key={li} className="pl-2 text-slate-700">• {line.slice(2).replace(/\*\*/g, '')}</p>
                            if (line.startsWith('|')) return null
                            if (line.trim() === '') return <br key={li} />
                            return <p key={li} className="text-slate-700">{line.replace(/\*\*/g, '')}</p>
                          })}
                        </div>

                        {m.wealth_action && (
                          <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                              ⚡ Dashboard & Database Updated live!
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">Saved to SQLite</span>
                          </div>
                        )}
                      </div>

                      {m.suggestions && m.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.suggestions.map((s, si) => (
                            <button
                              key={si}
                              onClick={() => sendMsg(s)}
                              className="text-[11px] bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-600 px-2.5 py-1 rounded-full transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}

              {thinking && (
                <div className="flex gap-2.5 items-center text-xs text-slate-400">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white shrink-0 animate-pulse">
                    ✨
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-1 font-medium">Computing on-device...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Side Panel Input with full multiline textarea support */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-1.5 flex items-end gap-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  rows={1}
                  value={sideInput}
                  onChange={e => setSideInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (sideInput.trim()) {
                        sendMsg(sideInput.trim())
                        setSideInput('')
                      }
                    }
                  }}
                  placeholder="Ask or update (e.g. 'change homeloan to 40L', 'add 10L cash')..."
                  className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none p-2 resize-none max-h-32 min-h-[36px]"
                />
                <VoiceMicButton
                  onTranscript={t => setSideInput(t)}
                  onAutoSend={t => {
                    const toSend = t || sideInput.trim()
                    if (toSend) {
                      sendMsg(toSend)
                      setSideInput('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (sideInput.trim()) {
                      sendMsg(sideInput.trim())
                      setSideInput('')
                    }
                  }}
                  disabled={!sideInput.trim() || thinking}
                  className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 shrink-0 mb-0.5"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Copilot Toggle Badge (when closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
          title="Open AI Copilot"
        >
          <Sparkles className="w-4 h-4" />
          <span>Halo Copilot</span>
        </button>
      )}

      {/* Sticky Bottom Bar on Dashboard for long queries (when side panel is closed) */}
      {!isChatOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-end gap-2 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold mb-0.5">
              ✨
            </div>

            <textarea
              rows={1}
              placeholder="Ask or speak in Hinglish (e.g. 'Change homeloan to 40 lakhs', 'Add 15L mutual funds')..."
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-sm py-2 px-1 resize-none max-h-32 min-h-[40px]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAsk()
                }
              }}
            />

            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              <VoiceMicButton
                onTranscript={handleVoiceTranscript}
                onAutoSend={t => {
                  const toSend = t || query.trim()
                  if (toSend) {
                    setQuery('')
                    sendMsg(toSend)
                  }
                }}
              />
              <button
                onClick={handleAsk}
                disabled={!query.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          setIsScanOpen(false)
          fetchSummary()
        }}
      />

      <DebtIngestionModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSuccess={() => {
          setIsDebtModalOpen(false)
          fetchSummary()
        }}
      />
    </div>
  )
}
