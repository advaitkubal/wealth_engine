import type { CSSProperties } from 'react'

interface Backer {
  name: string
  style: CSSProperties
}

const backers: Backer[] = [
  {
    name: 'Income Tax Act',
    style: {
      fontFamily: "'Times New Roman', Times, serif",
      fontWeight: 400,
      letterSpacing: '0.02em',
      fontSize: '14px',
    },
  },
  {
    name: 'SEBI Compliant',
    style: {
      fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif",
      fontWeight: 900,
      letterSpacing: '0.08em',
      fontSize: '16px',
    },
  },
  {
    name: 'RBI Guidelines',
    style: {
      fontFamily: "Impact, 'Arial Narrow', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.05em',
      fontSize: '18px',
    },
  },
  {
    name: '100% On-Device',
    style: {
      fontFamily: 'Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      fontSize: '17px',
    },
  },
  {
    name: 'Income Tax Act',
    style: {
      fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.01em',
      fontSize: '15px',
    },
  },
  {
    name: 'SEBI Compliant',
    style: {
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.06em',
      fontSize: '14px',
      textTransform: 'uppercase' as const,
    },
  },
  {
    name: 'RBI Guidelines',
    style: {
      fontFamily: "'Courier New', Courier, monospace",
      fontWeight: 700,
      letterSpacing: '0.18em',
      fontSize: '14px',
    },
  },
  {
    name: '100% On-Device',
    style: {
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      fontWeight: 500,
      letterSpacing: '0.03em',
      fontSize: '15px',
    },
  },
]

export default function BackedBySection() {
  return (
    <section className="bg-[#F5F5F5] px-6 py-16">
      <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
        {/* Left col (1/4) */}
        <p className="text-black/70 text-base leading-relaxed">
          Engineered around India's ITD rules and SEBI guidelines.
        </p>

        {/* Right col (3/4) — marquee */}
        <div className="md:col-span-3 overflow-hidden">
          <div className="backers-track">
            {[...backers, ...backers].map((backer, i) => (
              <span
                key={i}
                className="mx-10 shrink-0 text-black/50 whitespace-nowrap"
                style={backer.style}
              >
                {backer.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
