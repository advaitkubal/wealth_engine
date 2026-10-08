import { ArrowRight, Clock } from 'lucide-react'
import { Link } from '../router'

const ARTICLES = [
  {
    tag: 'Budget 2024',
    title: 'Decoding the Latest Union Budget Tax Slab Revisions',
    body: 'The Finance Act 2024 restructured New Regime slabs significantly — LTCG rates rose from 10% to 12.5% and the ₹1.25L exemption was introduced. Here\'s what changed and how to position your portfolio.',
    read: '6 min',
    date: 'Jul 2024',
  },
  {
    tag: 'Capital Gains',
    title: 'Maximising Section 54F Exemptions on Capital Gains',
    body: 'Section 54F allows complete LTCG exemption if net consideration is reinvested in a residential property. But the rules around partial exemptions, construction timelines, and the one-property condition are frequently misunderstood.',
    read: '8 min',
    date: 'Jun 2024',
  },
  {
    tag: 'Wealth Tech',
    title: 'Why On-Device AI is the Future of Wealth Technology',
    body: 'As India\'s financial data sovereignty concerns grow, local-first AI platforms eliminate the systemic risk of centralised cloud breaches. WebAssembly LLMs now match cloud inference quality for financial reasoning tasks.',
    read: '5 min',
    date: 'May 2024',
  },
  {
    tag: 'Tax Planning',
    title: 'NPS vs ELSS: Which Saves More Tax in FY 2024-25?',
    body: 'NPS offers an extra ₹50,000 deduction under 80CCD(1B) on top of the 80C limit, while ELSS offers the shortest lock-in at 3 years with equity-linked returns. A detailed comparison for salaried professionals.',
    read: '7 min',
    date: 'Apr 2024',
  },
  {
    tag: 'Portfolio',
    title: 'Tax Loss Harvesting Before March 31: A Step-by-Step Guide',
    body: 'February–March is the optimal window to book capital losses, offset gains, and reset your cost basis — legally reducing your tax outflow without changing your long-term portfolio exposure.',
    read: '9 min',
    date: 'Mar 2024',
  },
  {
    tag: 'Real Estate',
    title: 'LTCG on Property After Budget 2024: Indexation Removed',
    body: 'Budget 2024 removed indexation benefits on real estate LTCG, replacing it with a flat 12.5% rate. For properties bought before 2001 the calculation is different. Here\'s the complete impact analysis.',
    read: '10 min',
    date: 'Aug 2024',
  },
]

const TAG_COLORS: Record<string, string> = {
  'Budget 2024': '#2B2644', 'Capital Gains': '#6366f1', 'Wealth Tech': '#10b981',
  'Tax Planning': '#f59e0b', 'Portfolio': '#ec4899', 'Real Estate': '#0ea5e9',
}

export default function Insights() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      {/* Mission hero */}
      <div className="px-6 pt-16 pb-20">
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-black/40 text-sm uppercase tracking-widest mb-4">Our Mission</p>
            <h1 className="text-4xl md:text-5xl font-medium text-black leading-tight mb-6" style={{ letterSpacing:'-0.04em' }}>
              Democratising Private Wealth Intelligence for India.
            </h1>
            <p className="text-black/60 text-base leading-relaxed mb-6" style={{ fontFamily:"'Inter', sans-serif" }}>
              India's financial system is structurally complex — multiple tax regimes, layered SEBI regulations, inflation-linked instruments, and property-specific capital gains rules create a landscape that demands expert navigation.
            </p>
            <p className="text-black/60 text-base leading-relaxed" style={{ fontFamily:"'Inter', sans-serif" }}>
              Yet most wealth platforms either outsource computation to opaque cloud services or restrict intelligent tools to HNI clients. Halo is built to change this: a private, local-first intelligence layer that runs entirely in your browser, trained on the same legislative texts and circulars your CA uses — available to everyone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v:'₹0',       l:'Data sold to third parties' },
              { v:'100%',     l:'On-device computation' },
              { v:'FY 24-25', l:'Tax rules up to date' },
              { v:'Open',     l:'Architecture & source code' },
            ].map(({ v, l }) => (
              <div key={l} className={`rounded-2xl p-6 ${v === '100%' ? 'bg-[#2B2644] text-white' : 'bg-white border border-gray-100'}`}>
                <p className={`text-3xl font-medium mb-1 ${v === '100%' ? 'text-white' : 'text-black'}`}
                  style={{ letterSpacing:'-0.04em' }}>{v}</p>
                <p className={`text-sm ${v === '100%' ? 'text-white/50' : 'text-black/50'}`}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="bg-white px-6 py-20">
        <div className="max-w-[88rem] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-black/40 text-sm uppercase tracking-widest mb-2">Knowledge Base</p>
              <h2 className="text-3xl md:text-4xl font-medium text-black" style={{ letterSpacing:'-0.03em' }}>
                Tax & Market Analysis
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTICLES.map(({ tag, title, body, read, date }) => (
              <article key={title}
                className="bg-[#F5F5F5] rounded-2xl p-6 flex flex-col gap-4 hover:bg-[#2B2644] group transition-colors duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full group-hover:bg-white/20 group-hover:text-white transition-colors"
                    style={{ background:`${TAG_COLORS[tag]}18`, color: TAG_COLORS[tag] }}>
                    {tag}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-black/40 group-hover:text-white/40 transition-colors">
                    <Clock className="w-3 h-3" /> {read}
                  </div>
                </div>
                <h3 className="text-base font-medium text-black group-hover:text-white transition-colors leading-snug"
                  style={{ letterSpacing:'-0.01em' }}>{title}</h3>
                <p className="text-sm text-black/60 group-hover:text-white/60 leading-relaxed transition-colors flex-1">{body}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-black/40 group-hover:text-white/40 transition-colors">{date}</span>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-white/60 transition-colors" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-[#2B2644] px-6 py-20">
        <div className="max-w-[88rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-white text-3xl md:text-4xl font-medium max-w-lg" style={{ letterSpacing:'-0.03em' }}>
              Take control of your wealth today — without sacrificing privacy.
            </h2>
          </div>
          <Link to="/wealth-engine"
            className="shrink-0 inline-flex items-center gap-3 bg-white text-black text-base font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            Open Wealth Engine
            <span className="bg-black rounded-full p-2 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
