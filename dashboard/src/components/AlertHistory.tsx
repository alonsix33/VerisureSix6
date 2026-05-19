import { useStore } from '../store'
import { AlertTriangle } from 'lucide-react'

export default function AlertHistory() {
  const events = useStore((s) => s.events)

  const alerts = events.filter(
    (e) => ['high', 'critical'].includes(e.alert_level) && e.sheriff_decision
  )

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((event, i) => (
        <div
          key={event.id}
          className="md-card p-4 border-l-4 border-l-red-500 animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-red-300">
                  {event.device_name || event.device_id}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-300 font-medium uppercase">
                  {event.alert_level}
                </span>
              </div>
              {event.sheriff_decision?.message && (
                <p className="text-sm text-[var(--md-on-surface)] mt-1">
                  {event.sheriff_decision.message}
                </p>
              )}
              {event.sheriff_decision?.reasoning && (
                <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 italic">
                  {event.sheriff_decision.reasoning}
                </p>
              )}
              <p className="text-[10px] text-[var(--md-on-surface-variant)] mt-1.5 opacity-60">
                {event.timestamp
                  ? new Date(event.timestamp).toLocaleString('es-PE')
                  : ''}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
