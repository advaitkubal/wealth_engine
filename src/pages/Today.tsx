import { useState, useEffect } from 'react'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import { useNavigate } from '../router'

const MOCK_DATA = [
  { name: 'Jan', val: 100 },
  { name: 'Feb', val: 105 },
  { name: 'Mar', val: 102 },
  { name: 'Apr', val: 110 },
  { name: 'May', val: 115 },
  { name: 'Jun', val: 112 },
  { name: 'Jul', val: 120 },
  { name: 'Aug', val: 125 },
]

export default function Today() {
  const [query, setQuery] = useState('')
  const [score, setScore] = useState(850)
  const navigate = useNavigate()

  const handleAsk = () => {
    if (!query.trim()) return
    navigate(`/tax-planning?q=${encodeURIComponent(query.trim())}`)
  }

  useEffect(() => {
    fetch('http://localhost:8000/api/intelligence/halo-score')
      .then(r => r.json())
      .then(data => setScore(data.score))
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-[88rem] mx-auto w-full px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Good Morning, Advait 👋</h1>
          <p className="text-slate-500 mt-1">Here is your financial snapshot for today.</p>
        </div>
        <div className="flex items-center gap-3">
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
              <h2 className="text-4xl font-semibold text-slate-900 mt-1">₹1,25,00,000</h2>
              <p className="text-sm text-emerald-600 font-medium mt-1">+₹3.9L (3.2%) <span className="text-slate-400 font-normal">this month</span></p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
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
          <p className="text-sm font-medium text-slate-500 w-full text-left mb-6">Tax Liability</p>
          <div className="relative w-48 h-24 overflow-hidden mb-4">
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-slate-100"></div>
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-indigo-600" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', transform: 'rotate(130deg)' }}></div>
          </div>
          <div className="-mt-14 mb-6">
            <p className="text-xs text-slate-400 font-medium">Current Liability</p>
            <h3 className="text-2xl font-bold text-slate-900">₹65,400</h3>
          </div>
          <div className="w-full bg-slate-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-slate-500">Next Due:</span>
            <span className="text-sm font-semibold text-slate-900">15 Sep 2024</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-24 overflow-x-auto pb-4">
        {['Scan & Pay', 'Transfer', 'Invest', 'Pay Bills', 'Add Income'].map(btn => (
          <button key={btn} className="whitespace-nowrap px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
            {btn}
          </button>
        ))}
      </div>

      {/* Sticky AI Chat */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl p-2 flex items-center">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mr-3 shrink-0">
            ✨
          </div>
          <input 
            type="text" 
            placeholder="Ask anything about your finances..." 
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base py-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk() }}
          />
          <button 
            onClick={handleAsk}
            className="ml-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Ask Halo
          </button>
        </div>
      </div>
    </div>
  )
}
