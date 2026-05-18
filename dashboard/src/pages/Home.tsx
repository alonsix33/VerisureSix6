import { useEffect } from 'react'
import { useStore } from '../store'
import EventTimeline from '../components/EventTimeline'
import AlertHistory from '../components/AlertHistory'

export default function Home() {
  const events = useStore((s) => s.events)
  const config = useStore((s) => s.config)
  const health = useStore((s) => s.health)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const wsConnected = useStore((s) => s.wsConnected)

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  const criticalCount = events.filter((e) =>
    ['high', 'critical'].includes(e.alert_level)
  ).length

  const todayAlerts = events.filter((e) => {
    const today = new Date().toISOString().slice(0, 10)
    return e.timestamp?.startsWith(today) && e.alert_level !== 'none'
  }).length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard
          label="Modo"
          value={config?.mode || '—'}
          color={modeColor(config?.mode || '')}
        />
        <StatusCard
          label="Alertas hoy"
          value={String(todayAlerts)}
          color={todayAlerts > 0 ? 'text-orange-400' : 'text-green-400'}
        />
        <StatusCard
          label="Críticas"
          value={String(criticalCount)}
          color={criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}
        />
        <StatusCard
          label="Estado"
          value={wsConnected ? 'En vivo' : 'Offline'}
          color={wsConnected ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      {/* Health info */}
      {health && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span>RF: {health.services.rf.running ? '✅' : '❌'}</span>
          <span>Tapo: {health.services.tapo.running ? '✅' : '❌'}</span>
          <span>v{health.version}</span>
        </div>
      )}

      {/* Recent events */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Últimos eventos
        </h2>
        <EventTimeline limit={20} />
      </section>

      {/* Alert history */}
      {criticalCount > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Alertas activas
          </h2>
          <AlertHistory />
        </section>
      )}
    </div>
  )
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  )
}

function modeColor(mode: string) {
  const colors: Record<string, string> = {
    off: 'text-slate-400',
    monitor: 'text-blue-400',
    normal: 'text-green-400',
    away: 'text-yellow-400',
    travel: 'text-red-400',
  }
  return colors[mode] || 'text-slate-400'
}
