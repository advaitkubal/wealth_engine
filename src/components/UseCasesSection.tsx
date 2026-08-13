import { ArrowRight } from 'lucide-react'

export default function UseCasesSection() {
  return (
    <section className="bg-[#F5F5F5] px-6 py-24">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left column */}
        <div className="md:pr-12 md:pt-2">
          <p className="text-black/60 text-sm mb-2 tracking-wide">
            tailored wealth strategies
          </p>
          <h2
            className="text-5xl md:text-6xl font-medium leading-none mb-6"
            style={{ letterSpacing: '-0.04em' }}
          >
            Core Capabilities
          </h2>
          <p className="text-black/60 text-base leading-relaxed max-w-sm">
            From tax harvesting to multi-asset allocation, our engine processes complex financial scenarios offline with zero latency.
          </p>
        </div>

        {/* Right column — video card */}
        <div className="relative rounded-3xl overflow-hidden min-h-[720px] group">
          {/* Background video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover absolute inset-0 w-full h-full"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4"
          />

          {/* Overlay content */}
          <div className="relative z-10 p-10 md:p-12 flex flex-col justify-start h-full">
            <h3
              className="text-4xl md:text-5xl font-medium leading-tight mb-5"
              style={{ letterSpacing: '-0.03em' }}
            >
            Tax Loss Harvesting
            </h3>
            <p
              className="text-black/70 text-base max-w-md mb-8 leading-relaxed"
              style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
            >
            Automatically identify offset opportunities across short-term and long-term equities before the financial year ends—saving tax with simple, automated execution.
            </p>

            {/* Know more link */}
            <a
              href="#"
              className="inline-flex items-center gap-3 font-medium text-base group"
            >
              <span className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center group-hover:bg-white transition-colors duration-200">
                <ArrowRight className="w-4 h-4 text-black" />
              </span>
              Analyze Tax Savings
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
