import { useStore } from '../store'
import type { EventData } from '../types'

const LEVEL_COLORS: Record<string, string> = {
  none: 'bg-slate-700',
  low: 'bg-yellow-500',
  medium: 'bg-orange-500',
  high: 'bg-red-500',
  critical: 'bg-red-600 animate-pulse',
}

const LEVEL_LABELS: Record<string, string> = {
  none: 'Normal',
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

interface Props {
  limit?: number
  showAll?: boolean
}

export default function EventTimeline({ limit = 50, showAll }: Props) {
  const events = useStore((s) => s.events)

  const display = showAll ? events.slice(0, limit) : events.filter(
    (e) => e.alert_level !== 'none'
  ).slice(0, limit)

  if (display.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-8">
        {showAll ? 'No hay eventos registrados' : 'No hay alertas activas'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {display.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

function EventCard({ event }: { event: EventData }) {
  const time = event.timestamp
    ? new Date(event.timestamp).toLocaleString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : '—'

  return (
    <div className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div
        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
          LEVEL_COLORS[event.alert_level] || 'bg-slate-700'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">
            {event.device_name || event.device_id}
          </span>
          {event.alert_level !== 'none' && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                event.alert_level === 'high' || event.alert_level === 'critical'
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-yellow-900/50 text-yellow-300'
              }`}
            >
              {LEVEL_LABELS[event.alert_level]}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {event.event_type}
          {event.zone ? ` · ${event.zone}` : ''}
        </div>
        {event.sheriff_decision?.reasoning && event.alert_level !== 'none' && (
          <div className="text-xs text-slate-500 mt-1 italic">
            {event.sheriff_decision.reasoning}
          </div>
        )}
      </div>
      <div className="text-[10px] text-slate-500 shrink-0">{time}</div>
    </div>
  )
}
