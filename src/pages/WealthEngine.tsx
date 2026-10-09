import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, TrendingUp, AlertCircle, X, RefreshCw, Upload } from 'lucide-react'
import DonutChart from '../components/DonutChart'
import BarChart from '../components/BarChart'
import DocumentScanModal from '../components/DocumentScanModal'

const API = 'http://localhost:8000/api/wealth'

interface Asset     { id: number; type: string; label: string; value: number; yield_pct: number }
interface Liability { id: number; type: string; label: string; remaining: number; rate: number; emi: number; tenure: number }

const ASSET_COLORS: Record<string, string> = {
  'Equity': '#2B2644', 'Mutual Funds': '#6366f1', 'Gold': '#f59e0b',
  'Real Estate': '#10b981', 'NPS/PPF': '#a5b4fc', 'Cash': '#d1d5db',
}
const ASSET_TYPES = ['Equity', 'Mutual Funds', 'Gold', 'Real Estate', 'NPS/PPF', 'Cash']
const LIAB_TYPES  = ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan']



function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

type ModalMode = 'asset' | 'liability' | null

export default function WealthEngine() {
  const [assets,  setAssets]  = useState<Asset[]>([])
  const [liabs,   setLiabs]   = useState<Liability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [modal,   setModal]   = useState<ModalMode>(null)
  const [isScanOpen, setIsScanOpen] = useState(false)

  const [form, setForm] = useState({
    type: ASSET_TYPES[0], label: '', value: '', yield_pct: '',
    rate: '', emi: '', tenure: '',
  })
  const fv = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const [summary, setSummary] = useState<any>(null)

  // ── Fetch from backend ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, lRes, sRes] = await Promise.all([
        fetch(`${API}/assets`),
        fetch(`${API}/liabilities`),
        fetch(`${API}/summary`),
      ])
      setAssets(await aRes.json())
      setLiabs(await lRes.json())
      setSummary(await sRes.json())
    } catch (e) {
      console.error('Failed to load wealth data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    fetchData() 

    const handleUpdate = () => {
      fetchData()
    }
    window.addEventListener('halo:wealth_updated', handleUpdate)
    return () => window.removeEventListener('halo:wealth_updated', handleUpdate)
  }, [fetchData])

  // ── Derived ─────────────────────────────────────────────────────────────
  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabs  = liabs.reduce((s, l) => s + l.remaining, 0)
  const netWorth    = totalAssets - totalLiabs
  const donutData   = assets.map(a => ({ label: a.type, value: a.value, color: ASSET_COLORS[a.type] ?? '#9ca3af' }))

  const inhand = summary?.monthly_inhand || (assets.length > 0 ? 287000 : 160000)
  const totalMonthlyEmi = liabs.reduce((s, l) => s + (l.emi || 0), 0)
  const dynamicBarData = [
    { month: 'Mar', income: Math.round(inhand * 0.94), emi: totalMonthlyEmi },
    { month: 'Apr', income: Math.round(inhand * 0.96), emi: totalMonthlyEmi },
    { month: 'May', income: Math.round(inhand * 0.98), emi: totalMonthlyEmi },
    { month: 'Jun', income: inhand, emi: totalMonthlyEmi },
    { month: 'Jul', income: inhand, emi: totalMonthlyEmi },
    { month: 'Aug', income: inhand, emi: totalMonthlyEmi },
  ]

  // ── Add asset ───────────────────────────────────────────────────────────
  const addAsset = async () => {
    if (!form.label || !form.value) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: form.type, label: form.label, value: +form.value, yield_pct: +form.yield_pct || 0 }),
      })
      const newAsset = await res.json()
      setAssets(a => [...a, newAsset])
      setModal(null)
      setForm({ type: ASSET_TYPES[0], label: '', value: '', yield_pct: '', rate: '', emi: '', tenure: '' })
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ── Add liability ────────────────────────────────────────────────────────
  const addLiab = async () => {
    if (!form.label || !form.value) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/liabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: form.type, label: form.label, remaining: +form.value, rate: +form.rate || 0, emi: +form.emi || 0, tenure: +form.tenure || 0 }),
      })
      const newLiab = await res.json()
      setLiabs(l => [...l, newLiab])
      setModal(null)
      setForm({ type: ASSET_TYPES[0], label: '', value: '', yield_pct: '', rate: '', emi: '', tenure: '' })
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteAsset = async (id: number) => {
    setAssets(a => a.filter(x => x.id !== id))
    await fetch(`${API}/assets/${id}`, { method: 'DELETE' }).catch(console.error)
  }
  const deleteLiab = async (id: number) => {
    setLiabs(l => l.filter(x => x.id !== id))
    await fetch(`${API}/liabilities/${id}`, { method: 'DELETE' }).catch(console.error)
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
      <div className="max-w-[88rem] mx-auto w-full px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-medium text-black" style={{ letterSpacing: '-0.03em' }}>Wealth Engine</h1>
            <p className="text-black/50 text-base mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Your live private financial dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsScanOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              <span>+ Add Data (Upload PDF)</span>
            </button>
            <button onClick={fetchData} className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors px-3 py-2 bg-white rounded-xl border border-gray-200">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-black/30 text-sm">Loading your portfolio…</div>
        ) : (
          <>
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
                <BarChart data={dynamicBarData} />
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
                        <span className="text-xs text-emerald-600">{a.yield_pct}% p.a.</span>
                      </div>
                    </div>
                    <button onClick={() => deleteAsset(a.id)}
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
                    <button onClick={() => deleteLiab(l.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
                  <input type="number" value={form.yield_pct} onChange={e => fv('yield_pct', e.target.value)} placeholder="0"
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
              <button onClick={modal === 'asset' ? addAsset : addLiab} disabled={saving}
                className="bg-[#2B2644] text-white py-3 rounded-xl font-medium hover:bg-black transition-colors mt-1 disabled:opacity-50">
                {saving ? 'Saving…' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Ingestion Modal */}
      <DocumentScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          setIsScanOpen(false)
          fetchData()
        }}
      />
    </div>
  )
}
