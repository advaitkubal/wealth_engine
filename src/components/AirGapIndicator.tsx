import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function AirGapIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium border border-emerald-500/20">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <ShieldCheckIcon className="w-4 h-4" />
      100% On-Device
    </div>
  )
}
