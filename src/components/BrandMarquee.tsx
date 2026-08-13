import type { CSSProperties } from 'react'

interface Brand {
  name: string
  style: CSSProperties
}

const brands: Brand[] = [
  {
    name: 'Stripe',
    style: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontSize: '15px',
    },
  },
  {
    name: 'COINBASE',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 900,
      letterSpacing: '0.08em',
      fontSize: '13px',
      textTransform: 'uppercase' as const,
    },
  },
  {
    name: 'Mutual Funds',
    style: {
      fontFamily: "'Trebuchet MS', sans-serif",
      fontWeight: 600,
      letterSpacing: '0.01em',
      fontSize: '15px',
      fontStyle: 'italic',
    },
  },
  {
    name: 'Equity & ETFs',
    style: {
      fontFamily: "'Courier New', Courier, monospace",
      fontWeight: 700,
      letterSpacing: '0.12em',
      fontSize: '13px',
      textTransform: 'uppercase' as const,
    },
  },
  {
    name: 'NPS & PPF',
    style: {
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      fontWeight: 400,
      letterSpacing: '-0.01em',
      fontSize: '16px',
    },
  },
  {
    name: 'Real Estate & Gold',
    style: {
      fontFamily: "'Impact', 'Arial Narrow', sans-serif",
      fontWeight: 400,
      letterSpacing: '0.04em',
      fontSize: '14px',
    },
  },
  {
    name: 'Chainlink',
    style: {
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
      fontSize: '13px',
    },
  },
]

export default function BrandMarquee() {
  return (
    <div className="mt-24 w-full max-w-md overflow-hidden">
      <div className="marquee-track">
        {/* Render twice for seamless loop */}
        {[...brands, ...brands].map((brand, i) => (
          <span
            key={i}
            className="mx-7 shrink-0 text-black/60 whitespace-nowrap"
            style={brand.style}
          >
            {brand.name}
          </span>
        ))}
      </div>
    </div>
  )
}
