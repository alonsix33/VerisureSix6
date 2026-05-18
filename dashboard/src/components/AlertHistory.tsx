import { useStore } from '../store'

export default function AlertHistory() {
  const events = useStore((s) => s.events)

  const alerts = events.filter(
    (e) => ['high', 'critical'].includes(e.alert_level) && e.sheriff_decision
  )

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((event) => (
        <div
          key={event.id}
          className="bg-red-900/20 border border-red-800/50 rounded-xl p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-red-300">
              {event.device_name || event.device_id}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 font-medium uppercase">
              {event.alert_level}
            </span>
          </div>
          {event.sheriff_decision?.message && (
            <p className="text-sm text-slate-300 mt-1">
              {event.sheriff_decision.message}
            </p>
          )}
          <div className="text-[10px] text-slate-500 mt-1">
            {event.timestamp
              ? new Date(event.timestamp).toLocaleString('es-PE')
              : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
