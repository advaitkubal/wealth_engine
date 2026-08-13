import { useState } from 'react'
import { Plus, Trash2, TrendingUp, AlertCircle, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import DonutChart from '../components/DonutChart'
import BarChart from '../components/BarChart'

interface Asset  { id: number; type: string; label: string; value: number; yield: number }
interface Liability { id: number; type: string; label: string; remaining: number; rate: number; emi: number; tenure: number }

const ASSET_COLORS: Record<string, string> = {
  'Equity': '#2B2644', 'Mutual Funds': '#6366f1', 'Gold': '#f59e0b',
  'Real Estate': '#10b981', 'NPS/PPF': '#a5b4fc', 'Cash': '#d1d5db',
}
const ASSET_TYPES  = ['Equity','Mutual Funds','Gold','Real Estate','NPS/PPF','Cash']
const LIAB_TYPES   = ['Home Loan','Car Loan','Personal Loan','Credit Card','Education Loan']

const INIT_ASSETS: Asset[] = [
  { id:1, type:'Equity',       label:'NIFTY 50 ETF',        value:450000,  yield:12.5 },
  { id:2, type:'Mutual Funds', label:'HDFC Flexicap Fund',  value:280000,  yield:11.2 },
  { id:3, type:'Gold',         label:'Digital Gold',        value:120000,  yield:8.0  },
  { id:4, type:'Real Estate',  label:'Residential Property',value:3500000, yield:6.5  },
  { id:5, type:'NPS/PPF',      label:'PPF Account',         value:350000,  yield:7.1  },
  { id:6, type:'Cash',         label:'Savings Account',     value:85000,   yield:3.5  },
]
const INIT_LIABS: Liability[] = [
  { id:1, type:'Home Loan', label:'SBI Home Loan',  remaining:2800000, rate:8.5, emi:25000, tenure:180 },
  { id:2, type:'Car Loan',  label:'HDFC Car Loan',  remaining:450000,  rate:9.0, emi:12000, tenure:42  },
]
const BAR_DATA = [
  { month:'Mar', income:145000, emi:37000 },
  { month:'Apr', income:152000, emi:37000 },
  { month:'May', income:148000, emi:37000 },
  { month:'Jun', income:160000, emi:37000 },
  { month:'Jul', income:155000, emi:37000 },
  { month:'Aug', income:162000, emi:37000 },
]

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

type ModalMode = 'asset' | 'liability' | null

export default function WealthEngine() {
  const [assets,  setAssets]  = useState<Asset[]>(INIT_ASSETS)
  const [liabs,   setLiabs]   = useState<Liability[]>(INIT_LIABS)
  const [modal,   setModal]   = useState<ModalMode>(null)
  const [nextId,  setNextId]  = useState(10)

  // Form state
  const [form, setForm] = useState({ type: ASSET_TYPES[0], label: '', value: '', yield: '', rate: '', emi: '', tenure: '' })
  const fv = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabs  = liabs.reduce((s, l) => s + l.remaining, 0)
  const netWorth    = totalAssets - totalLiabs

  const donutData = assets.map(a => ({ label: a.type, value: a.value, color: ASSET_COLORS[a.type] ?? '#9ca3af' }))

  const addAsset = () => {
    if (!form.label || !form.value) return
    setAssets(a => [...a, { id: nextId, type: form.type, label: form.label, value: +form.value, yield: +form.yield || 0 }])
    setNextId(n => n + 1); setModal(null)
    setForm({ type: ASSET_TYPES[0], label:'', value:'', yield:'', rate:'', emi:'', tenure:'' })
  }
  const addLiab = () => {
    if (!form.label || !form.value) return
    setLiabs(l => [...l, { id: nextId, type: form.type, label: form.label, remaining: +form.value, rate: +form.rate || 0, emi: +form.emi || 0, tenure: +form.tenure || 0 }])
    setNextId(n => n + 1); setModal(null)
    setForm({ type: ASSET_TYPES[0], label:'', value:'', yield:'', rate:'', emi:'', tenure:'' })
  }

  const KPI = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="bg-white rounded-2xl px-6 py-5 border border-gray-100 shadow-sm">
      <p className="text-black/50 text-sm mb-1">{label}</p>
      <p className="text-2xl md:text-3xl font-medium text-black" style={{ letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-xs text-black/40 mt-1">{sub}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Navbar />
      <div className="max-w-[88rem] mx-auto w-full px-6 py-10">
        <h1 className="text-4xl md:text-5xl font-medium text-black mb-2" style={{ letterSpacing: '-0.03em' }}>Wealth Engine</h1>
        <p className="text-black/50 text-base mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>Your live private financial dashboard</p>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KPI label="Total Assets"      value={fmt(totalAssets)} sub={`${assets.length} asset classes`} />
          <KPI label="Total Liabilities" value={fmt(totalLiabs)}  sub={`${liabs.length} active loans`} />
          <div className="bg-[#2B2644] rounded-2xl px-6 py-5">
            <p className="text-white/50 text-sm mb-1">Net Wealth</p>
            <p className="text-2xl md:text-3xl font-medium text-white" style={{ letterSpacing: '-0.02em' }}>{fmt(netWorth)}</p>
            <p className="text-xs text-white/30 mt-1">All values in INR</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="font-medium text-black mb-5" style={{ letterSpacing: '-0.01em' }}>Asset Allocation</p>
            <DonutChart data={donutData} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="font-medium text-black mb-5" style={{ letterSpacing: '-0.01em' }}>Monthly Income vs EMI (₹)</p>
            <BarChart data={BAR_DATA} />
          </div>
        </div>

        {/* Assets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-black">Assets</h2>
            <button onClick={() => { setForm(f => ({ ...f, type: ASSET_TYPES[0] })); setModal('asset') }}
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-start justify-between group">
                <div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full mb-2 inline-block"
                    style={{ background: `${ASSET_COLORS[a.type]}18`, color: ASSET_COLORS[a.type] }}>
                    {a.type}
                  </span>
                  <p className="text-sm font-medium text-black">{a.label}</p>
                  <p className="text-xl font-medium text-black mt-1" style={{ letterSpacing: '-0.02em' }}>{fmt(a.value)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">{a.yield}% p.a.</span>
                  </div>
                </div>
                <button onClick={() => setAssets(arr => arr.filter(x => x.id !== a.id))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-black/30 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-black">Liabilities</h2>
            <button onClick={() => { setForm(f => ({ ...f, type: LIAB_TYPES[0] })); setModal('liability') }}
              className="inline-flex items-center gap-2 border border-black text-black text-sm font-medium px-5 py-2.5 rounded-full hover:bg-black hover:text-white transition-colors">
              <Plus className="w-4 h-4" /> Add Liability
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liabs.map(l => (
              <div key={l.id} className="bg-[#2B2644] rounded-2xl px-5 py-4 flex items-start justify-between group">
                <div>
                  <span className="text-xs font-medium text-white/50 mb-1 block">{l.type}</span>
                  <p className="text-sm font-medium text-white">{l.label}</p>
                  <p className="text-xl font-medium text-white mt-1" style={{ letterSpacing: '-0.02em' }}>{fmt(l.remaining)}</p>
                  <div className="flex gap-4 mt-2 text-xs text-white/40">
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{l.rate}% p.a.</span>
                    <span>EMI: {fmt(l.emi)}/mo</span>
                    <span>{l.tenure} months left</span>
                  </div>
                </div>
                <button onClick={() => setLiabs(arr => arr.filter(x => x.id !== l.id))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium">{modal === 'asset' ? 'Add Asset' : 'Add Liability'}</h3>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-black/40" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-black/50 mb-1 block">Type</label>
                <select value={form.type} onChange={e => fv('type', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none">
                  {(modal === 'asset' ? ASSET_TYPES : LIAB_TYPES).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-black/50 mb-1 block">Label / Name</label>
                <input value={form.label} onChange={e => fv('label', e.target.value)} placeholder="e.g. Axis Bluechip Fund"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none" />
              </div>
              <div>
                <label className="text-xs text-black/50 mb-1 block">{modal === 'asset' ? 'Current Value (₹)' : 'Remaining Balance (₹)'}</label>
                <input type="number" value={form.value} onChange={e => fv('value', e.target.value)} placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none" />
              </div>
              {modal === 'asset' ? (
                <div>
                  <label className="text-xs text-black/50 mb-1 block">Annualized Yield (%)</label>
                  <input type="number" value={form.yield} onChange={e => fv('yield', e.target.value)} placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-black/50 mb-1 block">Interest Rate (%)</label>
                      <input type="number" value={form.rate} onChange={e => fv('rate', e.target.value)} placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-black/50 mb-1 block">Monthly EMI (₹)</label>
                      <input type="number" value={form.emi} onChange={e => fv('emi', e.target.value)} placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-black/50 mb-1 block">Remaining Tenure (months)</label>
                    <input type="number" value={form.tenure} onChange={e => fv('tenure', e.target.value)} placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none" />
                  </div>
                </>
              )}
              <button onClick={modal === 'asset' ? addAsset : addLiab}
                className="bg-[#2B2644] text-white py-3 rounded-xl font-medium hover:bg-black transition-colors mt-1">
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
