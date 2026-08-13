import { ArrowRight } from 'lucide-react'

const CARD_IMAGE_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85'

export default function InfoSection() {
  return (
    <section className="bg-[#F5F5F5] px-6 py-24">
      <div className="max-w-[88rem] mx-auto">
        {/* Row 1: heading + body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
          {/* Left */}
          <div>
            <h2
              className="text-black text-4xl md:text-5xl font-medium leading-tight mb-8"
              style={{ letterSpacing: '-0.03em' }}
            >
              Meet Your Local Wealth OS.
            </h2>
            {/* Discover pill button */}
            <button className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200">
              Explore Features
              <span className="bg-white rounded-full p-2 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-black" />
              </span>
            </button>
          </div>

          {/* Right */}
          <p className="text-black/70 text-2xl md:text-3xl leading-relaxed">
            An intelligent wealth platform that runs entirely in your local browser, offering precise Indian tax optimization without external data tracking.
          </p>
        </div>

        {/* Row 2: 4-col cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — lg:col-span-2, background image */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: `url('${CARD_IMAGE_URL}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="p-7 min-h-80 flex flex-col justify-between">
              <h3
                className="text-black text-2xl font-medium leading-snug"
                style={{ letterSpacing: '-0.02em' }}
              >
              Tax-Smart Growth
              </h3>
              <p className="text-black/70 text-base max-w-xs">
                Maximize post-tax returns by automatically aligning capital gains, LTCG/STCG offsets, and Section 80C rules with high-performing strategies.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div
            className="rounded-2xl p-7 min-h-80 flex flex-col justify-between"
            style={{ backgroundColor: '#2B2644' }}
          >
            <h3
              className="text-white text-2xl font-medium leading-snug"
              style={{ letterSpacing: '-0.02em' }}
            >
              Zero Cloud. 100% Private.
            </h3>
            <p className="text-white/60 text-base">
              Your financial records never leave your machine. Calculations and portfolio analysis execute strictly on your device for absolute privacy.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="rounded-2xl p-7 min-h-80 flex flex-col justify-between"
            style={{ backgroundColor: '#2B2644' }}
          >
            <h3
              className="text-white text-2xl font-medium leading-snug"
              style={{ letterSpacing: '-0.02em' }}
            >
              Automated Indian Tax Compliance.
            </h3>
            <p className="text-white/60 text-base">
              Skip the task of tuning positions yourself. USD Halo runs in the
              background for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
