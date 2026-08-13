import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'

interface Msg { role: 'user' | 'ai'; text: string; clauses?: string[]; suggestions?: string[] }

const QUICK = [
  { label: 'Optimize Section 80C',              q: 'How do I maximize my Section 80C deductions for FY 2024-25?' },
  { label: 'LTCG on Equity vs Debt',            q: 'What is the LTCG tax difference between equity and debt mutual funds?' },
  { label: 'Old vs New Tax Regime',             q: 'Compare old vs new tax regime for a ₹15L salary with standard deductions.' },
  { label: 'Tax Loss Harvesting Rules',         q: 'Explain the rules for tax loss harvesting in Indian equity markets.' },
]

const AI_RESPONSES: Record<string, { text: string; clauses: string[]; suggestions: string[] }> = {
  '80c': {
    text: `**Section 80C — Maximum Deduction: ₹1,50,000**\n\nHere are the most efficient instruments to exhaust your 80C limit:\n\n• **ELSS Mutual Funds** — 3-year lock-in, equity-linked returns (historically 12–15% p.a.)\n• **PPF (Public Provident Fund)** — 7.1% p.a., 15-year tenure, completely tax-free on maturity\n• **NPS Tier-I** — Additional ₹50,000 deduction under **Section 80CCD(1B)** over and above 80C\n• **Life Insurance Premiums** — Eligible if premium ≤ 10% of sum assured\n• **Principal repayment on Home Loan** — Counts toward 80C limit\n\n**Pro tip:** ELSS + NPS is the most tax-efficient combination if you have a long investment horizon.`,
    clauses: ['Section 80C', 'Section 80CCD(1B)', 'Section 10(38)'],
    suggestions: ['How does ELSS compare to PPF?', 'Is NPS better than EPF?', 'Calculate my 80C gap'],
  },
  'ltcg': {
    text: `**LTCG Tax: Equity vs Debt Mutual Funds (FY 2024-25)**\n\n**Equity Mutual Funds (held > 1 year):**\n• LTCG rate: **12.5%** (Budget 2024 revision from 10%)\n• Exemption: First **₹1.25 lakh** of gains per FY is tax-free\n• No indexation benefit\n\n**Debt Mutual Funds (purchased after 1 Apr 2023):**\n• Treated as **Short-Term Capital Gains** regardless of holding period\n• Taxed at your **applicable income tax slab rate**\n• Budget 2023 removed the beneficial LTCG+indexation treatment\n\n**Conclusion:** Debt MFs now lose their tax advantage. For tax efficiency, prefer equity MFs, direct bonds, or FDs within lower tax brackets.`,
    clauses: ['Section 112A', 'Section 50AA', 'Finance Act 2023'],
    suggestions: ['What about ELSS LTCG?', 'Tax on international fund LTCG?', 'Optimize with tax loss harvesting'],
  },
  'regime': {
    text: `**Old vs New Tax Regime — ₹15L Gross Salary**\n\n**Old Regime (with deductions):**\n| Deduction | Amount |\n|---|---|\n| Standard Deduction | ₹50,000 |\n| Section 80C | ₹1,50,000 |\n| Section 80D | ₹25,000 |\n| HRA (assumed) | ₹1,20,000 |\n| **Taxable Income** | **₹11,55,000** |\n| **Tax Liability** | **~₹1,67,400** |\n\n**New Regime (FY 2024-25):**\n| Slab | Rate |\n|---|---|\n| Up to ₹3L | 0% |\n| ₹3L–₹7L | 5% |\n| ₹7L–₹10L | 10% |\n| ₹10L–₹12L | 15% |\n| ₹12L–₹15L | 20% |\n| Standard Deduction | ₹75,000 |\n| **Taxable Income** | **₹14,25,000** |\n| **Tax Liability** | **~₹1,70,000** |\n\n**Verdict:** At ₹15L with high deductions, both regimes are nearly equal. Use our Calculators page for precise comparison.`,
    clauses: ['Section 115BAC', 'Finance Act 2024', 'Section 87A Rebate'],
    suggestions: ['At what income does new regime win?', 'Does HRA change the calculation?', 'Open Tax Regime Calculator'],
  },
  'harvesting': {
    text: `**Tax Loss Harvesting in Indian Equity Markets**\n\nTax loss harvesting lets you **offset capital gains with losses** to reduce your tax liability.\n\n**Rules:**\n• **Short-term losses** can offset both STCG and LTCG\n• **Long-term losses** can only offset LTCG (not STCG)\n• Losses can be **carried forward for 8 assessment years**\n• Must file ITR within the due date to carry forward losses\n\n**Wash Sale Rule:** India has **no wash sale rule** unlike the US — you can sell and immediately repurchase the same security.\n\n**Best Window:** Do this in **February–March** before the financial year ends. Book losses in underperforming stocks, reinvest, and reset your cost basis.\n\n**Example:** ₹2L LTCG on NIFTY ETF + ₹80K LTCG loss on a small-cap stock = Net taxable LTCG of ₹1.2L (within the ₹1.25L exemption — **zero tax!**)`,
    clauses: ['Section 70', 'Section 74', 'Section 112A'],
    suggestions: ['Identify harvesting opportunities', 'How to report losses in ITR?', 'Carry-forward loss rules'],
  },
}

function pickResponse(q: string) {
  const l = q.toLowerCase()
  if (l.includes('80c') || l.includes('elss') || l.includes('ppf')) return AI_RESPONSES['80c']
  if (l.includes('ltcg') || l.includes('debt') || l.includes('equity')) return AI_RESPONSES['ltcg']
  if (l.includes('regime') || l.includes('old') || l.includes('new')) return AI_RESPONSES['regime']
  if (l.includes('harvest') || l.includes('loss')) return AI_RESPONSES['harvesting']
  return {
    text: `I'm your **AI Tax Advisor**, trained on the Indian Income Tax Act and SEBI guidelines.\n\nI can help you with:\n• Section 80C/80D optimization\n• LTCG/STCG capital gains computation\n• Old vs New tax regime comparison\n• Tax loss harvesting strategies\n• ITR filing guidance\n\nTry one of the quick topics on the left, or ask me a specific question about your tax situation.`,
    clauses: [],
    suggestions: ['Optimize Section 80C', 'Old vs New Regime', 'Explain LTCG rules'],
  }
}

function ClauseTag({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(!open)}
      className="inline-flex items-center gap-1 text-xs bg-[#2B2644]/10 text-[#2B2644] px-2.5 py-1 rounded-full font-medium hover:bg-[#2B2644]/20 transition-colors"
    >
      {label}
      {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
    </button>
  )
}

function AiCard({ msg, onSuggest }: { msg: Msg; onSuggest: (s: string) => void }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#2B2644] flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-gray-100">
          <div className="prose prose-sm max-w-none text-black/80 text-sm leading-relaxed whitespace-pre-line">
            {msg.text.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**'))
                return <p key={i} className="font-semibold text-black mb-1">{line.replace(/\*\*/g, '')}</p>
              if (line.startsWith('• '))
                return <p key={i} className="pl-3 mb-0.5 text-black/70">• {line.slice(2).replace(/\*\*/g, (_, __, s: string) => s)}</p>
              if (line.startsWith('|')) return null
              return <p key={i} className="mb-1 text-black/70">{line.replace(/\*\*/g, '')}</p>
            })}
          </div>
          {msg.clauses && msg.clauses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-black/40 mb-2">Tax clause references</p>
              <div className="flex flex-wrap gap-2">{msg.clauses.map(c => <ClauseTag key={c} label={c} />)}</div>
            </div>
          )}
        </div>
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.suggestions.map(s => (
              <button key={s} onClick={() => onSuggest(s)}
                className="text-xs bg-black/5 hover:bg-black/10 text-black/70 px-3 py-1.5 rounded-full transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TaxPlanning() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'ai',
    text: `Welcome! I'm your **AI Tax Advisor**, trained on the Indian Income Tax Act, Budget 2024 updates, and ITD circulars.\n\nAll processing happens entirely on your device — zero data leaves your browser.\n\nAsk me anything about Indian tax planning, or pick a quick topic from the sidebar.`,
    clauses: [],
    suggestions: ['Optimize Section 80C', 'LTCG on Equity vs Debt', 'Old vs New Regime'],
  }])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, thinking])

  const send = (text: string) => {
    if (!text.trim() || thinking) return
    setMsgs(m => [...m, { role: 'user', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const resp = pickResponse(text)
      setMsgs(m => [...m, { role: 'ai', ...resp }])
      setThinking(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-[88rem] mx-auto w-full px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-medium text-black mb-3" style={{ letterSpacing: '-0.03em' }}>
            AI Tax Advisor
          </h1>
          <p className="text-black/60 text-base max-w-xl leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Trained on the Indian Income Tax Act, Budget updates, and ITD circulars. Zero data leaves your device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 h-[70vh]">
          {/* Sidebar */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-black/40 uppercase tracking-widest mb-1">Quick Topics</p>
            {QUICK.map(({ label, q }) => (
              <button key={label} onClick={() => send(q)}
                className="text-left px-4 py-3.5 bg-white rounded-2xl border border-gray-100 text-sm font-medium text-black/80 hover:bg-[#2B2644] hover:text-white hover:border-[#2B2644] transition-all duration-200 shadow-sm">
                {label}
              </button>
            ))}
            <div className="mt-auto p-4 bg-[#2B2644] rounded-2xl text-white/60 text-xs leading-relaxed">
              <Sparkles className="w-4 h-4 text-white/80 mb-2" />
              100% on-device AI. Your queries and financial data never leave this browser session.
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {msgs.map((m, i) =>
                m.role === 'ai' ? (
                  <AiCard key={i} msg={m} onSuggest={send} />
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="bg-[#2B2644] text-white text-sm px-5 py-3 rounded-2xl rounded-tr-sm max-w-md">
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {thinking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2B2644] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 bg-[#2B2644]/40 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4 flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Ask anything about Indian tax codes or paste your portfolio summary..."
                className="flex-1 text-sm bg-[#F5F5F5] rounded-xl px-4 py-3 outline-none text-black placeholder-black/40"
              />
              <button onClick={() => send(input)}
                className="bg-[#2B2644] text-white p-3 rounded-xl hover:bg-black transition-colors duration-200">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
