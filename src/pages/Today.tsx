import { useState, useEffect } from 'react'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import { useNavigate } from '../router'
import VoiceMicButton from '../components/VoiceMicButton'
import DocumentScanModal from '../components/DocumentScanModal'
import { Upload, RefreshCw, ChevronRight, Sparkles } from 'lucide-react'

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

  const fmtCr = (val: number) => {
    if (!val) return '₹0'
    const cr = val / 10000000
    if (cr >= 1) return `₹${cr.toFixed(2)}Cr`
    const l = val / 100000
    return `₹${l.toFixed(1)}L`
  }

  return (
    <div className="max-w-[88rem] mx-auto w-full px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Good Morning, Advait 👋</h1>
          <p className="text-slate-500 mt-1">Here is your live financial snapshot for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScanOpen(true)}
            className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Scan Document
          </button>
          <div className="bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm flex items-center gap-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Halo Score</div>
            <div className="text-xl font-bold text-indigo-600">{score}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Net Worth Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Net Worth</p>
              <h2 className="text-4xl font-semibold text-slate-900 mt-1">
                {summary ? fmtCr(summary.net_worth) : '₹3.41Cr'}
              </h2>
              <p className="text-sm text-emerald-600 font-medium mt-1">
                Total Assets: {summary ? fmtCr(summary.total_assets) : '₹4.14Cr'} | Liabilities: {summary ? fmtCr(summary.total_liabilities) : '₹73.2L'}
              </p>
            </div>
            <button
              onClick={() => navigate('/wealth-engine')}
              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors"
            >
              Wealth Engine <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-48 w-full mt-4">
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

        {/* Tax Meter Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center justify-center">
          <p className="text-sm font-medium text-slate-500 w-full text-left mb-6">Tax Liability Meter</p>
          <div className="relative w-48 h-24 overflow-hidden mb-4">
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-slate-100"></div>
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-indigo-600" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', transform: 'rotate(130deg)' }}></div>
          </div>
          <div className="-mt-14 mb-6">
            <p className="text-xs text-slate-400 font-medium">Estimated Annual Tax</p>
            <h3 className="text-2xl font-bold text-slate-900">₹1,09,200</h3>
          </div>
          <div className="w-full bg-slate-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-slate-500">Next Advance Tax:</span>
            <span className="text-sm font-semibold text-slate-900">15 Sep (₹27,300)</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-24 overflow-x-auto pb-4">
        <button
          onClick={() => setIsScanOpen(true)}
          className="whitespace-nowrap px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Scan CAS / Form 16 / CSV
        </button>

        <button
          onClick={() => navigate('/wealth-engine')}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Manage Assets &amp; Loans
        </button>

        <button
          onClick={() => navigate('/what-if')}
          className="whitespace-nowrap px-6 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" /> What-If Life Simulators
        </button>

        <button
          onClick={() => navigate('/calculators')}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Tax Calculators
        </button>

        <button
          onClick={() => {
            fetch('http://localhost:8000/api/wealth/reset', { method: 'POST' })
              .then(fetchSummary)
          }}
          className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-medium rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Portfolio Seed
        </button>
      </div>

      {/* Sticky AI Chat */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
            ✨
          </div>

          <input 
            type="text" 
            placeholder="Ask anything or speak (e.g. 'Open wealth engine', 'Calculate tax on 15L')..." 
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
