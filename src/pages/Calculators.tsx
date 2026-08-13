import { useState } from 'react'
import Navbar from '../components/Navbar'

/* ── Helpers ── */
function fmt(n: number) { return `₹${Math.round(n).toLocaleString('en-IN')}` }

function taxSlab(income: number, slabs: { upto: number; rate: number }[]) {
  let tax = 0, prev = 0
  for (const s of slabs) {
    if (income <= prev) break
    tax += (Math.min(income, s.upto) - prev) * s.rate
    prev = s.upto
  }
  return tax * 1.04 // 4% cess
}

const OLD_SLABS = [
  { upto:250000,  rate:0    },
  { upto:500000,  rate:0.05 },
  { upto:1000000, rate:0.20 },
  { upto:Infinity,rate:0.30 },
]
const NEW_SLABS = [
  { upto:300000,  rate:0    },
  { upto:700000,  rate:0.05 },
  { upto:1000000, rate:0.10 },
  { upto:1200000, rate:0.15 },
  { upto:1500000, rate:0.20 },
  { upto:Infinity,rate:0.30 },
]

function Slider({ label, min, max, step=1, value, onChange, display }:
  { label:string; min:number; max:number; step?:number; value:number; onChange:(v:number)=>void; display:string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-black/60">{label}</span>
        <span className="font-medium text-black">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full accent-[#2B2644]" />
    </div>
  )
}

/* ── Tax Regime Calculator ── */
function TaxRegimeCalc() {
  const [income, setIncome] = useState(1500000)
  const [c80,  setC80]  = useState(150000)
  const [c80d, setC80d] = useState(25000)
  const [hra,  setHra]  = useState(120000)

  const oldTaxable = Math.max(0, income - 50000 - c80 - c80d - hra)
  const oldTax  = taxSlab(oldTaxable, OLD_SLABS)
  const newTaxable = Math.max(0, income - 75000)
  const newTax  = taxSlab(newTaxable, NEW_SLABS)
  const better  = oldTax <= newTax ? 'Old Regime' : 'New Regime'
  const saving  = Math.abs(oldTax - newTax)

  return (
    <div className="flex flex-col gap-5">
      <Slider label="Annual Income" min={300000} max={5000000} step={50000}
        value={income} onChange={setIncome} display={fmt(income)} />
      <Slider label="Section 80C" min={0} max={150000} step={5000}
        value={c80} onChange={setC80} display={fmt(c80)} />
      <Slider label="Section 80D (Health)" min={0} max={75000} step={1000}
        value={c80d} onChange={setC80d} display={fmt(c80d)} />
      <Slider label="HRA Exemption" min={0} max={300000} step={5000}
        value={hra} onChange={setHra} display={fmt(hra)} />
      <div className="grid grid-cols-2 gap-3 mt-2">
        {[{ l:'Old Regime Tax', v:oldTax }, { l:'New Regime Tax', v:newTax }].map(({ l, v }) => (
          <div key={l} className="bg-[#F5F5F5] rounded-xl p-4">
            <p className="text-xs text-black/50 mb-1">{l}</p>
            <p className="text-xl font-medium text-black" style={{ letterSpacing:'-0.02em' }}>{fmt(v)}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#2B2644] rounded-xl p-4 text-white">
        <p className="text-white/60 text-xs mb-0.5">Optimal choice — saves you</p>
        <p className="text-lg font-medium">{better} <span className="text-white/60 text-sm">· {fmt(saving)} saved</span></p>
      </div>
    </div>
  )
}

/* ── Capital Gains Calculator ── */
function CapGainsCalc() {
  const [asset,    setAsset]    = useState('Equity Stocks')
  const [purchase, setPurchase] = useState(200000)
  const [sale,     setSale]     = useState(350000)
  const [months,   setMonths]   = useState(18)

  const THRESHOLDS: Record<string, number> = { 'Equity Stocks':12,'Mutual Funds':12,'Crypto':0,'Real Estate':24 }
  const ltcgThreshold = THRESHOLDS[asset] ?? 12
  const isLong = months >= ltcgThreshold
  const gain   = Math.max(0, sale - purchase)
  const RATES: Record<string, { lt:number; st:number }> = {
    'Equity Stocks': { lt:0.125, st:0.20 },
    'Mutual Funds':  { lt:0.125, st:0.20 },
    'Crypto':        { lt:0.30,  st:0.30 },
    'Real Estate':   { lt:0.125, st:0.30 },
  }
  const rate  = isLong ? RATES[asset]?.lt ?? 0.125 : RATES[asset]?.st ?? 0.20
  const exemption = (isLong && asset !== 'Crypto' && asset !== 'Real Estate') ? 125000 : 0
  const taxable = Math.max(0, gain - exemption)
  const tax   = taxable * rate * 1.04

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-xs text-black/50 mb-1.5 block">Asset Type</label>
        <select value={asset} onChange={e => setAsset(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-[#F5F5F5] outline-none">
          {['Equity Stocks','Mutual Funds','Crypto','Real Estate'].map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <Slider label="Purchase Price (₹)" min={10000} max={2000000} step={10000}
        value={purchase} onChange={setPurchase} display={fmt(purchase)} />
      <Slider label="Sale Price (₹)" min={10000} max={2000000} step={10000}
        value={sale} onChange={setSale} display={fmt(sale)} />
      <Slider label="Holding Period (months)" min={1} max={60}
        value={months} onChange={setMonths} display={`${months} mo`} />
      <div className="bg-[#F5F5F5] rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-black/50">Gain</span><span className="font-medium">{fmt(gain)}</span></div>
        <div className="flex justify-between"><span className="text-black/50">Type</span>
          <span className={`font-medium ${isLong ? 'text-emerald-600':'text-orange-500'}`}>{isLong?'LTCG':'STCG'}</span></div>
        <div className="flex justify-between"><span className="text-black/50">Rate</span><span className="font-medium">{(rate*100).toFixed(1)}%</span></div>
        {exemption>0 && <div className="flex justify-between"><span className="text-black/50">Exemption (§112A)</span><span className="font-medium text-emerald-600">{fmt(exemption)}</span></div>}
      </div>
      <div className="bg-[#2B2644] rounded-xl p-4 text-white">
        <p className="text-white/60 text-xs mb-0.5">Estimated Tax Liability (incl. 4% cess)</p>
        <p className="text-2xl font-medium">{fmt(tax)}</p>
      </div>
    </div>
  )
}

/* ── SIP Calculator ── */
function SIPCalc() {
  const [monthly, setMonthly] = useState(10000)
  const [rate,    setRate]    = useState(12)
  const [years,   setYears]   = useState(10)
  const n = years * 12
  const r = rate / 12 / 100
  const fv = monthly * ((Math.pow(1+r,n)-1)/r) * (1+r)
  const invested = monthly * n
  const returns  = fv - invested

  return (
    <div className="flex flex-col gap-5">
      <Slider label="Monthly Investment" min={500} max={100000} step={500}
        value={monthly} onChange={setMonthly} display={fmt(monthly)} />
      <Slider label="Expected Return (% p.a.)" min={4} max={30}
        value={rate} onChange={setRate} display={`${rate}%`} />
      <Slider label="Tenure" min={1} max={40}
        value={years} onChange={setYears} display={`${years} yrs`} />
      <div className="grid grid-cols-3 gap-3 mt-2">
        {[
          { l:'Invested', v:fmt(invested), c:'text-black' },
          { l:'Returns',  v:fmt(returns),  c:'text-emerald-600' },
          { l:'Total',    v:fmt(fv),       c:'text-[#2B2644]' },
        ].map(({ l, v, c }) => (
          <div key={l} className="bg-[#F5F5F5] rounded-xl p-4 text-center">
            <p className="text-xs text-black/50 mb-1">{l}</p>
            <p className={`text-base font-medium ${c}`} style={{ letterSpacing:'-0.01em' }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#2B2644] rounded-xl p-4 text-white">
        <p className="text-white/60 text-xs mb-0.5">Future Value after {years} years</p>
        <p className="text-2xl font-medium">{fmt(fv)}</p>
      </div>
    </div>
  )
}

/* ── Tax-Saving Planner ── */
function TaxSavingPlanner() {
  const [target, setTarget] = useState(150000)
  const instruments = [
    { name:'ELSS Mutual Fund', pct:0.40, min:500,    lock:'3 yr', color:'#2B2644' },
    { name:'PPF',              pct:0.30, min:500,    lock:'15 yr',color:'#6366f1' },
    { name:'NPS Tier-I',       pct:0.20, min:1000,   lock:'Till 60',color:'#a5b4fc' },
    { name:'Tax-Saver FD',     pct:0.10, min:10000,  lock:'5 yr', color:'#f59e0b' },
  ]
  return (
    <div className="flex flex-col gap-5">
      <Slider label="80C Target" min={50000} max={150000} step={5000}
        value={target} onChange={setTarget} display={fmt(target)} />
      <div className="space-y-3">
        {instruments.map(({ name, pct, lock, color }) => {
          const alloc = Math.round(target * pct / 500) * 500
          return (
            <div key={name} className="flex items-center gap-4 bg-[#F5F5F5] rounded-xl px-4 py-3">
              <div className="w-2 h-12 rounded-full shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{name}</p>
                <p className="text-xs text-black/40">Lock-in: {lock}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-black">{fmt(alloc)}</p>
                <p className="text-xs text-black/40">{(pct*100).toFixed(0)}%</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="bg-[#2B2644] rounded-xl p-4 text-white">
        <p className="text-white/60 text-xs mb-0.5">Total 80C utilised</p>
        <p className="text-2xl font-medium">{fmt(target)} <span className="text-base text-white/50">/ ₹1,50,000</span></p>
      </div>
    </div>
  )
}

const TABS = [
  { id:'regime',    label:'Old vs New Regime',      Comp: TaxRegimeCalc   },
  { id:'cg',        label:'Capital Gains Tax',       Comp: CapGainsCalc    },
  { id:'sip',       label:'SIP & Growth',            Comp: SIPCalc         },
  { id:'planner',   label:'Tax-Saving Planner',      Comp: TaxSavingPlanner},
]

export default function Calculators() {
  const [tab, setTab] = useState('regime')
  const Active = TABS.find(t => t.id === tab)!.Comp

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Navbar />
      <div className="max-w-[88rem] mx-auto w-full px-6 py-10">
        <h1 className="text-4xl md:text-5xl font-medium text-black mb-2" style={{ letterSpacing:'-0.03em' }}>
          Precision Tax &amp; Financial Calculators
        </h1>
        <p className="text-black/50 text-base mb-10" style={{ fontFamily:"'Inter', sans-serif" }}>
          Real-time computation, entirely in your browser.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Tab list */}
          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`shrink-0 text-left px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-[#2B2644] text-white shadow-md'
                    : 'bg-white text-black/70 border border-gray-100 hover:border-[#2B2644]/30'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Active calculator */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h2 className="text-xl font-medium text-black mb-6" style={{ letterSpacing:'-0.02em' }}>
              {TABS.find(t => t.id === tab)!.label}
            </h2>
            <Active />
          </div>
        </div>
      </div>
    </div>
  )
}
