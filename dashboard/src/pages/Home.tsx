import { useEffect } from 'react'
import { useStore } from '../store'
import EventTimeline from '../components/EventTimeline'
import AlertHistory from '../components/AlertHistory'
import { House, Activity, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

const MODE_META: Record<string, { label: string; icon: typeof House; color: string; desc: string }> = {
  off: { label: 'Desactivado', icon: House, color: 'text-slate-400', desc: 'Sistema apagado' },
  monitor: { label: 'Monitoreo', icon: Activity, color: 'text-blue-400', desc: 'Solo registra' },
  normal: { label: 'Normal', icon: House, color: 'text-green-400', desc: 'Alguien en casa' },
  away: { label: 'Fuera', icon: House, color: 'text-yellow-400', desc: 'Casa vacía' },
  travel: { label: 'Viaje', icon: AlertTriangle, color: 'text-red-400', desc: 'Máxima alerta' },
}

export default function Home() {
  const events = useStore((s) => s.events)
  const config = useStore((s) => s.config)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const wsConnected = useStore((s) => s.wsConnected)
  const loading = useStore((s) => s.loading)

  useEffect(() => { fetchInitial() }, [fetchInitial])

  const criticalCount = events.filter((e) =>
    ['high', 'critical'].includes(e.alert_level)
  ).length

  const todayAlerts = events.filter((e) => {
    const today = new Date().toISOString().slice(0, 10)
    return e.timestamp?.startsWith(today) && e.alert_level !== 'none'
  }).length

  if (loading && events.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="md-card p-4 animate-pulse">
              <div className="h-3 w-16 bg-[var(--md-surface-container-high)] rounded mb-2" />
              <div className="h-6 w-12 bg-[var(--md-surface-container-high)] rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="md-card p-3 animate-pulse">
              <div className="h-4 w-3/4 bg-[var(--md-surface-container-high)] rounded mb-2" />
              <div className="h-3 w-1/2 bg-[var(--md-surface-container-high)] rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const mode = config?.mode || 'off'
  const modeMeta = MODE_META[mode] || MODE_META.off
  const ModeIcon = modeMeta.icon

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Status cards — M3 elevation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="md-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ModeIcon size={16} className={modeMeta.color} aria-hidden="true" />
            <span className="text-xs text-[var(--md-on-surface-variant)]">Modo</span>
          </div>
          <span className={`text-lg font-bold ${modeMeta.color}`}>{modeMeta.label}</span>
          <span className="text-[10px] text-[var(--md-on-surface-variant)]">{modeMeta.desc}</span>
        </div>

        <div className="md-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-orange-400" />
            <span className="text-xs text-[var(--md-on-surface-variant)]">Alertas hoy</span>
          </div>
          <span className={`text-lg font-bold ${todayAlerts > 0 ? 'text-orange-400' : 'text-green-400'}`}>
            {todayAlerts}
          </span>
        </div>

        <div className="md-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className={criticalCount > 0 ? 'text-red-400' : 'text-slate-500'} />
            <span className="text-xs text-[var(--md-on-surface-variant)]">Críticas</span>
          </div>
          <span className={`text-lg font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {criticalCount}
          </span>
        </div>

        <div className="md-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {wsConnected
              ? <Wifi size={16} className="text-green-400" />
              : <WifiOff size={16} className="text-red-400" />
            }
            <span className="text-xs text-[var(--md-on-surface-variant)]">Estado</span>
          </div>
          <span className={`text-lg font-bold ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
            {wsConnected ? 'En vivo' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Activity section */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] mb-3 px-1">
          Actividad reciente
        </h2>
        <EventTimeline limit={15} />
      </section>

      {/* Critical alerts */}
      {criticalCount > 0 && (
        <section className="animate-fade-in">
          <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] mb-3 px-1">
            Alertas activas
          </h2>
          <AlertHistory />
        </section>
      )}
    </div>
  )
}
