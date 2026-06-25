import { useStore } from '../store'

const ROOMS = [
  { id: 'sala',    label: 'Sala',    x: 2,  y: 2,  w: 46, h: 50 },
  { id: 'cocina',  label: 'Cocina',  x: 2,  y: 54, w: 46, h: 44 },
  { id: 'balcon',  label: 'Balcón',  x: 50, y: 2,  w: 48, h: 46 },
  { id: 'entrada', label: 'Entrada', x: 50, y: 50, w: 48, h: 48 },
]

const SENSORS: { zone: string; x: number; y: number }[] = [
  { zone: 'sala',    x: 25, y: 27 },
  { zone: 'cocina',  x: 25, y: 76 },
  { zone: 'balcon',  x: 74, y: 25 },
  { zone: 'entrada', x: 74, y: 74 },
]

const LEGEND = [
  { label: 'Normal', token: '--map-dot-inactive' },
  { label: 'Activo', token: '--map-dot-active' },
  { label: 'Alerta', token: '--map-dot-alert' },
]

export default function HomeMap() {
  const events = useStore((s) => s.events)

  const zoneActivity = new Map<string, number>()
  events.slice(0, 100).forEach((e) => {
    if (e.zone) zoneActivity.set(e.zone, (zoneActivity.get(e.zone) || 0) + 1)
  })

  const hasAlert = (zone: string) =>
    events.slice(0, 20).some((e) => e.zone === zone && e.alert_level !== 'none')

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ background: 'var(--surface-overlay)' }}
    >
      <svg viewBox="0 0 100 100" className="w-full aspect-[4/3] max-h-64">

        {ROOMS.map((room) => {
          const count   = zoneActivity.get(room.id) || 0
          const active  = count > 0
          const alertOn = hasAlert(room.id)

          const fillToken   = alertOn ? '--map-room-alert' : active ? '--map-room-active' : '--map-room-inactive'
          const strokeToken = alertOn ? '--map-border-alert' : active ? '--map-border-active' : '--map-border-inactive'
          const textToken   = alertOn ? '--map-text-alert' : active ? '--map-text-active' : '--map-text-inactive'

          return (
            <g key={room.id}>
              <rect
                x={room.x + 0.5} y={room.y + 0.5}
                width={room.w - 1} height={room.h - 1}
                rx="2"
                style={{ fill: `var(${fillToken})`, stroke: `var(${strokeToken})`, strokeWidth: 0.6 }}
              />
              <text
                x={room.x + room.w / 2}
                y={room.y + room.h / 2 + 1.5}
                textAnchor="middle"
                fontSize="4"
                fontFamily="Inter, system-ui, sans-serif"
                style={{ fill: `var(${textToken})` }}
              >
                {room.label}
              </text>
            </g>
          )
        })}

        {SENSORS.map((sensor) => {
          const count   = zoneActivity.get(sensor.zone) || 0
          const active  = count > 1
          const alertOn = hasAlert(sensor.zone)

          const dotToken   = alertOn ? '--map-dot-alert' : active ? '--map-dot-active' : '--map-dot-inactive'
          const pulseToken = alertOn ? '--map-pulse-alert' : '--map-pulse-active'
          const ringToken  = alertOn ? '--map-border-alert' : '--map-border-active'

          return (
            <g key={sensor.zone}>
              {(active || alertOn) && (
                <circle
                  cx={sensor.x} cy={sensor.y} r="4.5"
                  style={{ fill: `var(${pulseToken})`, stroke: `var(${ringToken})`, strokeWidth: 0.5 }}
                  className="pulse-ring"
                />
              )}
              <circle
                cx={sensor.x} cy={sensor.y} r="2"
                style={{ fill: `var(${dotToken})` }}
              />
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div
        className="absolute top-2 right-2 flex items-center gap-3 px-2.5 py-1.5 rounded-xl"
        style={{ background: 'var(--surface-float)' }}
      >
        {LEGEND.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1 text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: `var(${item.token})` }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
