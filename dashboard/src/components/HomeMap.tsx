import { useStore } from '../store'

const SENSOR_POSITIONS: Record<string, { x: number; y: number }> = {
  sala: { x: 35, y: 30 },
  cocina: { x: 35, y: 70 },
  balcon: { x: 78, y: 45 },
  entrada: { x: 78, y: 80 },
}

export default function HomeMap() {
  const events = useStore((s) => s.events)

  const zoneActivity = new Map<string, number>()
  events.slice(0, 200).forEach((e) => {
    if (e.zone) zoneActivity.set(e.zone, (zoneActivity.get(e.zone) || 0) + 1)
  })

  return (
    <div className="md-card relative overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full aspect-[4/3] max-h-72">
        {/* Apartment floor plan */}
        <rect x="2" y="2" width="96" height="96" fill="none" stroke="var(--md-outline)" strokeWidth="0.5" rx="2" />
        <line x1="2" y1="55" x2="55" y2="55" stroke="var(--md-outline)" strokeWidth="0.4" />
        <line x1="55" y1="2" x2="55" y2="55" stroke="var(--md-outline)" strokeWidth="0.4" />

        {/* Room labels */}
        <text x="28" y="45" textAnchor="middle" fill="var(--md-on-surface-variant)" fontSize="4" opacity="0.6">Sala</text>
        <text x="28" y="80" textAnchor="middle" fill="var(--md-on-surface-variant)" fontSize="4" opacity="0.6">Cocina</text>
        <text x="78" y="30" textAnchor="middle" fill="var(--md-on-surface-variant)" fontSize="4" opacity="0.6">Balcón</text>
        <text x="78" y="65" textAnchor="middle" fill="var(--md-on-surface-variant)" fontSize="4" opacity="0.6">Entrada</text>

        {/* Sensor dots with pulse animation for active zones */}
        {Object.entries(SENSOR_POSITIONS).map(([zone, pos]) => {
          const count = zoneActivity.get(zone) || 0
          const isActive = count > 2
          const size = Math.min(5, 2.5 + count * 0.4)

          return (
            <g key={zone}>
              {isActive && (
                <circle
                  cx={pos.x} cy={pos.y}
                  r={size + 2}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.3"
                  opacity={0.4}
                  className="animate-pulse-ring"
                />
              )}
              <circle
                cx={pos.x} cy={pos.y}
                r={size}
                fill={isActive ? '#ef4444' : '#22c55e'}
                opacity={0.85}
              />
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex gap-2 bg-[var(--md-surface)]/90 px-2 py-1 rounded-full">
        {['Normal', 'Activo'].map((label) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-[var(--md-on-surface-variant)]">
            <span className={`w-1.5 h-1.5 rounded-full ${label === 'Normal' ? 'bg-green-500' : 'bg-red-500'}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
