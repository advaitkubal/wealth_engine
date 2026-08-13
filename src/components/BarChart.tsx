interface BarGroup { month: string; income: number; emi: number }

const W = 560, H = 200, PAD = { top: 16, right: 16, bottom: 32, left: 52 }
const BAR_W = 18, BAR_GAP = 6

export default function BarChart({ data }: { data: BarGroup[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.emi]))
  const chartH = H - PAD.top - PAD.bottom
  const chartW = W - PAD.left - PAD.right
  const groupW = chartW / data.length
  const scale = (v: number) => (v / maxVal) * chartH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxVal))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
      {/* Y gridlines + labels */}
      {ticks.map((t) => {
        const y = PAD.top + chartH - scale(t)
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end"
              fontSize={10} fill="#9ca3af">
              {t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const gx = PAD.left + i * groupW + groupW / 2
        const incomeX = gx - BAR_W - BAR_GAP / 2
        const emiX = gx + BAR_GAP / 2
        const iy = PAD.top + chartH - scale(d.income)
        const ey = PAD.top + chartH - scale(d.emi)
        return (
          <g key={d.month}>
            <rect x={incomeX} y={iy} width={BAR_W} height={scale(d.income)}
              rx={3} fill="#2B2644" />
            <rect x={emiX} y={ey} width={BAR_W} height={scale(d.emi)}
              rx={3} fill="#a5b4fc" />
            <text x={gx} y={H - 6} textAnchor="middle" fontSize={10} fill="#9ca3af">
              {d.month}
            </text>
          </g>
        )
      })}
      {/* Legend */}
      <g>
        <rect x={PAD.left} y={6} width={10} height={10} rx={2} fill="#2B2644" />
        <text x={PAD.left + 14} y={15} fontSize={10} fill="#6b7280">Income</text>
        <rect x={PAD.left + 70} y={6} width={10} height={10} rx={2} fill="#a5b4fc" />
        <text x={PAD.left + 84} y={15} fontSize={10} fill="#6b7280">EMI / Debt</text>
      </g>
    </svg>
  )
}
