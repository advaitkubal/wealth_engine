import { Shield, Database, EyeOff, Cpu, Lock, Globe, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'

const ARCH_CARDS = [
  {
    icon: Cpu,
    title: 'Local WebAssembly LLM',
    body: 'The tax intelligence model compiles to WebAssembly and executes entirely within your browser\'s sandboxed environment. It never calls an external API. All inference happens on your CPU — leveraging SIMD optimisations in modern browsers for near-native performance.',
    detail: 'Powered by Transformers.js + WASM SIMD',
    color: '#2B2644',
  },
  {
    icon: Database,
    title: 'Zero-Knowledge Data Storage',
    body: 'Your portfolio data, transaction history, and tax calculations are stored exclusively in IndexedDB and LocalStorage — both browser-native, client-side stores. No server session. No cloud sync. Data lives in your browser profile only.',
    detail: 'IndexedDB · AES-256 encrypted state · LocalStorage',
    color: '#6366f1',
  },
  {
    icon: EyeOff,
    title: 'No External Telemetry',
    body: 'There are zero third-party trackers, analytics SDKs, or cloud logging pipelines embedded in this platform. No request leaves your device to measure your usage, behaviour, or financial queries. Verified by open CSP headers.',
    detail: 'No cookies · No beacons · Strict CSP',
    color: '#10b981',
  },
]

const TECH_STACK = [
  { label: 'WebAssembly', icon: Cpu },
  { label: 'Transformers.js', icon: Cpu },
  { label: 'AES-256 Local State', icon: Lock },
  { label: 'Income Tax Act', icon: Shield },
  { label: 'SEBI Compliant', icon: CheckCircle },
  { label: 'RBI Guidelines', icon: Globe },
]

const FAQS = [
  { q: 'Can Halo see my financial data?', a: 'No. All data is stored locally in your browser\'s IndexedDB. Halo\'s servers receive zero financial information from your device.' },
  { q: 'What happens if I clear my browser cache?', a: 'Your local financial profile would be cleared. We recommend exporting a JSON backup from the Wealth Engine page before clearing browser data.' },
  { q: 'Is the AI model downloaded or remote?', a: 'The quantised LLM model is downloaded once to your browser\'s cache via a service worker, then runs entirely offline. No API calls to any LLM provider.' },
  { q: 'How is regulatory compliance maintained locally?', a: 'Tax rules are encoded as structured rule-sets updated through the app\'s version releases — similar to how offline apps ship content. No live API is required.' },
]

export default function Security() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#2B2644] px-6 py-24">
        <div className="max-w-[88rem] mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <Shield className="w-3.5 h-3.5" /> Architecture Overview
          </div>
          <h1 className="text-white text-4xl md:text-6xl font-medium max-w-3xl mb-6" style={{ letterSpacing:'-0.04em' }}>
            Privacy by Design.
            <br />Executed On-Device.
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed" style={{ fontFamily:"'Inter', sans-serif" }}>
            Your financial history, tax logs, and wealth metrics never touch external servers or third-party cloud APIs. Every computation runs in your browser.
          </p>

          {/* Quick stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
            {[
              { v:'0',     l:'External API Calls' },
              { v:'100%',  l:'On-Device Inference' },
              { v:'AES-256',l:'Data Encryption' },
              { v:'0ms',   l:'Network Latency' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-white/5 rounded-2xl px-5 py-5 border border-white/10">
                <p className="text-white text-3xl font-medium mb-1" style={{ letterSpacing:'-0.04em' }}>{v}</p>
                <p className="text-white/50 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture cards */}
      <div className="px-6 py-20">
        <div className="max-w-[88rem] mx-auto">
          <p className="text-black/40 text-sm mb-2 uppercase tracking-widest">Architecture</p>
          <h2 className="text-3xl md:text-4xl font-medium text-black mb-12" style={{ letterSpacing:'-0.03em' }}>
            How privacy is enforced
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ARCH_CARDS.map(({ icon: Icon, title, body, detail, color }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background:`${color}18` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black mb-2" style={{ letterSpacing:'-0.02em' }}>{title}</h3>
                  <p className="text-black/60 text-sm leading-relaxed">{body}</p>
                </div>
                <div className="mt-auto bg-[#F5F5F5] rounded-xl px-4 py-3 text-xs font-medium text-black/50">
                  {detail}
                </div>
              </div>
            ))}
          </div>

          {/* Tech stack bar */}
          <div className="mt-14 bg-[#2B2644] rounded-2xl px-8 py-7 flex flex-wrap gap-6 items-center justify-between">
            <p className="text-white/60 text-sm font-medium">Verified Tech Stack & Compliance</p>
            <div className="flex flex-wrap gap-3">
              {TECH_STACK.map(({ label, icon: Icon }) => (
                <div key={label} className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-4 py-2 rounded-full">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-medium text-black mb-8" style={{ letterSpacing:'-0.02em' }}>
              Common questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                  <p className="font-medium text-black text-sm mb-2">{q}</p>
                  <p className="text-black/60 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
