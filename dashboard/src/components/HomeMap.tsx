import { useStore } from '../store'

const ROOMS = [
  { id: 'sala',       label: 'Sala',       x: 10,  y: 10,  w: 150, h: 112, fillC: 'rgba(126,148,102,0.10)', strokeC: 'rgba(126,148,102,0.22)', textC: '#7A7065' },
  { id: 'dormitorio', label: 'Dormitorio', x: 170, y: 10,  w: 142, h: 72,  fillC: 'rgba(223,162,81,0.12)',  strokeC: 'rgba(223,162,81,0.28)',  textC: '#7A7065' },
  { id: 'cocina',     label: 'Cocina',     x: 170, y: 92,  w: 142, h: 58,  fillC: 'rgba(168,155,140,0.10)', strokeC: 'rgba(168,155,140,0.22)', textC: '#9A8E7E' },
  { id: 'entrada',    label: 'Entrada',    x: 10,  y: 132, w: 150, h: 66,  fillC: 'rgba(194,98,72,0.11)',   strokeC: 'rgba(194,98,72,0.28)',   textC: '#B05A40' },
  { id: 'nucleo',     label: 'Núcleo',     x: 170, y: 160, w: 142, h: 38,  fillC: 'rgba(126,148,102,0.10)', strokeC: 'rgba(126,148,102,0.20)', textC: '#7A7065' },
]


export default function HomeMap() {
  const events = useStore((s) => s.events)

  const hasAlert = (zone: string) =>
    events.slice(0, 20).some(
      (e) => e.zone?.toLowerCase() === zone && (e.alert_level === 'high' || e.alert_level === 'critical'),
    )

  const entradaAlert = hasAlert('entrada')

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 14 }}>
        Plano del hogar
      </p>
      <svg
        width="100%"
        viewBox="0 0 322 210"
        style={{ display: 'block' }}
        aria-label="Plano del hogar"
      >
        {ROOMS.map((r) => (
          <g key={r.id}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h} rx={9}
              fill={r.fillC} stroke={r.strokeC} strokeWidth={1}
            />
            <text
              x={r.x + 10} y={r.y + 18}
              fill={r.textC}
              fontSize={11}
              fontFamily="'Hanken Grotesk', system-ui, sans-serif"
              fontWeight={600}
            >
              {r.label}
            </text>
          </g>
        ))}

        {/* Sala sensor */}
        <circle cx={128} cy={58} r={4} fill="var(--status-safe)" />

        {/* Dormitorio sensor */}
        <circle cx={278} cy={48} r={4} fill="var(--accent)" />

        {/* Cocina sensor */}
        <circle cx={198} cy={126} r={4} fill="var(--status-offline)" />

        {/* Entrada — pulso animado */}
        <circle
          cx={56} cy={170} r={7}
          fill={entradaAlert ? 'rgba(194,98,72,0.4)' : 'rgba(194,98,72,0.25)'}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          className="anim-pulse"
        />
        <circle cx={56} cy={170} r={4.5} fill="var(--level-importante)" />

        <circle
          cx={118} cy={170} r={7}
          fill={entradaAlert ? 'rgba(194,98,72,0.4)' : 'rgba(194,98,72,0.25)'}
          style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0.7s' }}
          className="anim-pulse"
        />
        <circle cx={118} cy={170} r={4.5} fill="var(--level-importante)" />

        {/* Núcleo sensor */}
        <circle cx={241} cy={178} r={3.5} fill="var(--status-safe)" />
      </svg>
    </div>
  )
}
