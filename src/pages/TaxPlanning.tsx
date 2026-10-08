import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, ChevronUp, Sparkles, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'

interface Msg { role: 'user' | 'ai'; text: string; clauses?: string[]; suggestions?: string[] }

const STORAGE_KEY_MSGS = 'halo_chat_msgs'
const STORAGE_KEY_CONV = 'halo_chat_conv_id'

const QUICK = [
  { label: 'My Net Worth',                    q: 'What is my current net worth?' },
  { label: 'Optimize Section 80C',            q: 'How do I maximize my Section 80C deductions?' },
  { label: 'Should I pay off my loan early?', q: 'Should I prepay my home loan or invest that money?' },
  { label: 'Old vs New Tax Regime',           q: 'Which tax regime is better for me?' },
]

const WELCOME: Msg = {
  role: 'ai',
  text: `Hi! I'm Halo, your AI wealth advisor 👋\n\nI have access to your live portfolio and can help with tax planning, investments, loans, and more. What's on your mind?`,
  clauses: [],
  suggestions: ['My Net Worth', 'Optimize Section 80C', 'Should I pay off my loan early?'],
}

function loadMsgs(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MSGS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [WELCOME]
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
          <div className="prose prose-sm max-w-none text-black/80 text-sm leading-relaxed">
            {msg.text.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**'))
                return <p key={i} className="font-semibold text-black mb-1">{line.replace(/\*\*/g, '')}</p>
              if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
                return <p key={i} className="pl-3 mb-0.5 text-black/70">• {line.slice(2).replace(/\*\*/g, '')}</p>
              if (line.startsWith('|')) return null
              if (line.trim() === '') return <br key={i} />
              return <p key={i} className="mb-1 text-black/70">{line.replace(/\*\*/g, '')}</p>
            })}
          </div>
          {msg.clauses && msg.clauses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-black/40 mb-2">References</p>
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
  const [msgs, setMsgs]       = useState<Msg[]>(loadMsgs)
  const [convId, setConvId]   = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY_CONV) || undefined
  )
  const [input, setInput]     = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(msgs))
  }, [msgs])

  useEffect(() => {
    if (convId) localStorage.setItem(STORAGE_KEY_CONV, convId)
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, thinking])

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY_MSGS)
    localStorage.removeItem(STORAGE_KEY_CONV)
    setMsgs([WELCOME])
    setConvId(undefined)
  }

  const send = async (text: string) => {
    if (!text.trim() || thinking) return
    setMsgs(m => [...m, { role: 'user', text }])
    setInput('')
    setThinking(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, conversation_id: convId }),
      })

      const data = await response.json()
      if (data.conversation_id) setConvId(data.conversation_id)

      const citations = (data.sources ?? []).map((s: any) =>
        s.page ? `${s.document} (p. ${s.page})` : s.document
      )
      const unique = Array.from(new Set(citations)) as string[]

      setMsgs(m => [...m, {
        role: 'ai',
        text: data.answer || "Sorry, I couldn't generate a response.",
        clauses: unique,
      }])
    } catch {
      setMsgs(m => [...m, {
        role: 'ai',
        text: 'Error connecting to the AI backend. Please ensure the backend server is running.',
      }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-[88rem] mx-auto w-full px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-medium text-black mb-3" style={{ letterSpacing: '-0.03em' }}>
              AI Wealth Advisor
            </h1>
            <p className="text-black/60 text-base max-w-xl leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Connected to your live portfolio. Trained on Indian tax codes and finance. 100% on-device.
            </p>
          </div>
          <button onClick={clearChat}
            className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-red-500 transition-colors mt-2 shrink-0">
            <Trash2 className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 h-[70vh]">

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
              100% on-device AI. Your data never leaves this device.
            </div>
          </div>

          {/* Chat window */}
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
                placeholder="Ask about your portfolio, tax codes, investments..."
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
