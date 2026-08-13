interface Segment { label: string; value: number; color: string }

const R = 70, SW = 22, CX = 100, CY = 100
const CIRC = 2 * Math.PI * R

export default function DonutChart({ data }: { data: Segment[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cum = 0
  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-56 h-56">
        {data.map((seg, i) => {
          const frac = seg.value / total
          const len = frac * CIRC
          const offset = -cum
          cum += len
          return (
            <circle
              key={i} cx={CX} cy={CY} r={R}
              fill="none" stroke={seg.color} strokeWidth={SW}
              strokeDasharray={`${len} ${CIRC - len}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          )
        })}
        {/* Center hole label */}
        <circle cx={CX} cy={CY} r={R - SW / 2 - 4} fill="white" />
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
        {data.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-sm text-black/60">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
