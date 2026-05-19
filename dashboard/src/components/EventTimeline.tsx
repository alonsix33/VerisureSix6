import { useStore } from '../store'
import type { EventData } from '../types'

const LEVEL_CONFIG: Record<string, { color: string; textColor: string; bg: string; border: string; label: string }> = {
  none:    { color: 'bg-slate-500',  textColor: 'text-slate-400',  bg: 'bg-slate-900',     border: 'border-slate-500',  label: 'Normal' },
  low:     { color: 'bg-yellow-500', textColor: 'text-yellow-400', bg: 'bg-yellow-900/30',  border: 'border-yellow-500', label: 'Baja' },
  medium:  { color: 'bg-orange-500', textColor: 'text-orange-400', bg: 'bg-orange-900/30',  border: 'border-orange-500', label: 'Media' },
  high:    { color: 'bg-red-500',    textColor: 'text-red-400',    bg: 'bg-red-900/30',     border: 'border-red-500',    label: 'Alta' },
  critical:{ color: 'bg-red-600',    textColor: 'text-red-400',    bg: 'bg-red-900/50',     border: 'border-red-600',    label: 'Crítica' },
}

interface Props {
  limit?: number
  showAll?: boolean
  events?: EventData[]
}

export default function EventTimeline({ limit = 50, showAll, events: propEvents }: Props) {
  const storeEvents = useStore((s) => s.events)
  const events = propEvents ?? storeEvents

  const display = showAll
    ? events.slice(0, limit)
    : events.filter((e) => e.alert_level !== 'none').slice(0, limit)

  if (display.length === 0) {
    return (
      <div className="text-sm text-[var(--md-on-surface-variant)] text-center py-10">
        {showAll ? 'No hay eventos registrados' : 'No hay alertas activas'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {display.map((event, i) => (
        <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
          <EventCard event={event} />
        </div>
      ))}
    </div>
  )
}

function EventCard({ event }: { event: EventData }) {
  const level = event.alert_level || 'none'
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.none

  const time = event.timestamp
    ? new Date(event.timestamp).toLocaleString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : '—'

  return (
    <div className={`md-card p-3 flex items-start gap-3 ${level !== 'none' ? `border-l-2 ${cfg.border}` : ''}`}>
      {/* Indicator */}
      <div className="relative mt-1 shrink-0">
        <span className={`block w-2.5 h-2.5 rounded-full ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[var(--md-on-surface)] truncate">
            {event.device_name || event.device_id}
          </span>
          {level !== 'none' && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.textColor}`}>
              {cfg.label}
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
          {event.event_type}
          {event.zone ? ` · ${event.zone}` : ''}
        </div>
        {event.sheriff_decision?.reasoning && level !== 'none' && (
          <div className="text-xs text-[var(--md-on-surface-variant)]/70 mt-1.5 italic leading-relaxed">
            {event.sheriff_decision.reasoning}
          </div>
        )}
      </div>

      {/* Time */}
      <div className="text-[10px] text-[var(--md-on-surface-variant)] shrink-0">
        {time}
      </div>
    </div>
  )
}
