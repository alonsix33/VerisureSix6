import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Activity, AlertTriangle, Shield, Wifi, WifiOff, Radio, Eye } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'

const MODE_META = {
  off:     { label: 'Apagado',  desc: 'Sistema inactivo' },
  monitor: { label: 'Monitor',  desc: 'Solo registra' },
  casa:    { label: 'Casa',     desc: 'Alguien en casa' },
  fuera:   { label: 'Fuera',    desc: 'Casa vacía' },
  noche:   { label: 'Noche',    desc: 'Todos durmiendo' },
  viaje:   { label: 'Viaje',    desc: 'Máxima alerta 24/7' },
} as const

export default function Home() {
  const events       = useStore((s) => s.events)
  const config       = useStore((s) => s.config)
  const stats        = useStore((s) => s.stats)
  const devices      = useStore((s) => s.devices)
  const wsConnected  = useStore((s) => s.wsConnected)
  const loading      = useStore((s) => s.loading)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const fetchStats   = useStore((s) => s.fetchStats)
  const updateMode   = useStore((s) => s.updateSheriffMode)

  useEffect(() => {
    fetchInitial()
    fetchStats()
  }, [fetchInitial, fetchStats])

  const mode = (config?.mode ?? 'off') as keyof typeof MODE_META
  const meta = MODE_META[mode] ?? MODE_META.off

  const todayAlerts = stats?.today.alerts ?? events.filter((e) => {
    const today = new Date().toISOString().slice(0, 10)
    return e.timestamp?.startsWith(today) && e.alert_level !== 'none'
  }).length

  const recentEvents = events.slice(0, 5)
  const hourlyData   = stats?.by_hour ?? []

  if (loading && events.length === 0) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-44 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">

      {/* ── Hero status card ── */}
      <motion.div
        layout
        className="rounded-2xl p-5"
        style={{
          background: `var(--mode-${mode}-bg)`,
          border: `1px solid var(--mode-${mode}-border)`,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `var(--mode-${mode}-bg)`,
                  border: `1px solid var(--mode-${mode}-border)`,
                }}
              >
                <Shield size={28} style={{ color: `var(--mode-${mode})` }} />
              </div>
              {wsConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60"
                    style={{ background: `var(--mode-${mode})` }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-3 w-3"
                    style={{ background: `var(--mode-${mode})` }}
                  />
                </div>
              )}
            </div>
            <div>
              <div
                className="text-[11px] uppercase tracking-widest font-mono mb-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Modo activo
              </div>
              <div
                className="text-3xl font-black uppercase tracking-tight"
                style={{ color: `var(--mode-${mode})` }}
              >
                {meta.label}
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {meta.desc}
              </div>
            </div>
          </div>

          {/* Mode switcher */}
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(MODE_META) as [string, typeof MODE_META.off][]).map(([m, v]) => (
              <button
                key={m}
                onClick={() => updateMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all"
                style={{
                  background: m === mode ? `var(--mode-${m}-bg)` : 'transparent',
                  color: m === mode ? `var(--mode-${m})` : 'var(--text-disabled)',
                  border: `1px solid ${m === mode ? `var(--mode-${m}-border)` : 'var(--border-subtle)'}`,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stats 2×2 grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Eventos hoy',
            value: stats?.today.total_events ?? events.length,
            icon: Activity,
            tokenColor: '--accent-text',
          },
          {
            label: 'Alertas hoy',
            value: todayAlerts,
            icon: AlertTriangle,
            tokenColor: todayAlerts > 0 ? '--status-warn' : '--text-disabled',
          },
          {
            label: 'Dispositivos',
            value: devices.filter((d) => d.enabled).length,
            icon: Radio,
            tokenColor: '--text-secondary',
          },
          {
            label: 'Estado',
            value: wsConnected ? 'En vivo' : 'Offline',
            icon: wsConnected ? Wifi : WifiOff,
            tokenColor: wsConnected ? '--status-safe' : '--status-alert',
            isText: true,
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <stat.icon size={13} style={{ color: `var(${stat.tokenColor})` }} />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
            </div>
            <div
              className={`font-black ${stat.isText ? 'text-xl' : 'text-2xl'}`}
              style={{ color: `var(${stat.tokenColor})` }}
            >
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Chart + Devices ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Activity chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Actividad 24h
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--accent-text)' }}>
              {stats?.week.total_events ?? 0} esta semana
            </span>
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>eventos por hora</div>

          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-default)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent-default)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                  }}
                  itemStyle={{ color: 'var(--accent-text)' }}
                  labelFormatter={(v) => `${v}:00h`}
                />
                <Area
                  type="monotone" dataKey="count"
                  stroke="var(--accent-default)"
                  fill="url(#chartGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="h-20 flex items-center justify-center text-xs"
              style={{ color: 'var(--text-disabled)' }}
            >
              Sin datos aún
            </div>
          )}
        </div>

        {/* Device list */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Dispositivos
            </span>
            <Link
              to="/cameras"
              className="text-xs transition-colors"
              style={{ color: 'var(--accent-text)' }}
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {devices.slice(0, 4).map((device) => {
              const lastEvent = events.find((e) => e.device_id === device.device_id)
              const hasAlert  = lastEvent && lastEvent.alert_level !== 'none'
              return (
                <div
                  key={device.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'var(--surface-overlay)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: hasAlert ? 'var(--status-warn-bg)' : 'var(--surface-float)',
                    }}
                  >
                    <Eye size={14} style={{ color: hasAlert ? 'var(--status-warn)' : 'var(--text-tertiary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {device.name}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {device.zone ?? 'sin zona'}
                    </div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: device.enabled ? 'var(--status-safe)' : 'var(--text-disabled)' }}
                  />
                </div>
              )
            })}
            {devices.length === 0 && (
              <div className="text-xs text-center py-4" style={{ color: 'var(--text-disabled)' }}>
                Cargando dispositivos...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent events ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Actividad reciente
          </span>
          <Link to="/timeline" className="text-xs" style={{ color: 'var(--accent-text)' }}>
            Ver todo →
          </Link>
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-disabled)' }}>
                {config ? 'Sheriff monitoreando. Sin eventos recientes.' : 'Cargando...'}
              </div>
            ) : (
              recentEvents.map((event, idx) => {
                const level = event.alert_level
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="ribbon rounded-r-xl rounded-l-sm p-3 flex items-center gap-3"
                    data-level={level}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--surface-overlay)' }}
                    >
                      <Eye size={15} style={{ color: `var(--level-${level})` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {event.device_name ?? event.device_id}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {event.event_type.replace(/_/g, ' ')} · {event.zone ?? '—'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {level !== 'none' && (
                        <div
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1"
                          style={{
                            background: `var(--level-${level}-bg)`,
                            color: `var(--level-${level})`,
                          }}
                        >
                          {level}
                        </div>
                      )}
                      <div className="text-[10px] font-mono" style={{ color: 'var(--text-disabled)' }}>
                        {new Date(event.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Zone bars ── */}
      {stats?.by_zone && stats.by_zone.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} style={{ color: 'var(--accent-text)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Zonas — últimas 24h
            </span>
          </div>
          <div className="space-y-2.5">
            {stats.by_zone.slice(0, 5).map((z) => {
              const max = stats.by_zone[0]?.count ?? 1
              const pct = Math.round((z.count / max) * 100)
              const isActive = pct > 60
              const isWarn   = pct > 80
              return (
                <div key={z.zone} className="flex items-center gap-3">
                  <div
                    className="text-xs w-24 truncate capitalize"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {z.zone}
                  </div>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--surface-float)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: isWarn
                          ? 'var(--status-warn)'
                          : isActive
                          ? 'var(--accent-default)'
                          : 'var(--border-strong)',
                      }}
                    />
                  </div>
                  <div
                    className="text-xs font-mono w-6 text-right"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {z.count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
