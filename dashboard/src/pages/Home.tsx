import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Activity, AlertTriangle, Shield, Wifi, WifiOff, Radio, MapPin, Eye } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'

const MODE_META = {
  off:   { label: 'Apagado',  color: '#4A4A60', bg: 'bg-[#12121A]',    desc: 'Sistema inactivo' },
  casa:  { label: 'Casa',     color: '#00D084', bg: 'bg-[#001A10]',    desc: 'Alguien en casa' },
  fuera: { label: 'Fuera',    color: '#FFB800', bg: 'bg-[#1A1100]',    desc: 'Casa vacía' },
  noche: { label: 'Noche',    color: '#A78BFA', bg: 'bg-[#100A1A]',    desc: 'Todos durmiendo' },
  viaje: { label: 'Viaje',    color: '#FF3B3B', bg: 'bg-[#1A0505]',    desc: 'Máxima alerta 24/7' },
} as const

const ALERT_COLOR: Record<string, string> = {
  none: '#4A4A60', low: '#00D084', medium: '#FFB800', high: '#FF3B3B', critical: '#FF3B3B',
}

const EVENT_ICON: Record<string, string> = {
  motion_detected: '👁', camera_snapshot: '📷', zone_crossed: '🚶',
  alarm_triggered: '🚨', system_heartbeat: '💓',
}

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

  const recentEvents = events.slice(0, 8)
  const hourlyData = stats?.by_hour ?? []

  if (loading && events.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Hero status bar ── */}
      <motion.div
        layout
        className="rounded-2xl p-5 border"
        style={{
          background: `linear-gradient(135deg, ${meta.color}10 0%, transparent 60%)`,
          borderColor: `${meta.color}30`,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
              >
                <Shield size={28} style={{ color: meta.color }} />
              </div>
              {wsConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style={{ background: meta.color }} />
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: meta.color }} />
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-[#8080A0] uppercase tracking-widest font-mono mb-1">Modo activo</div>
              <div className="text-3xl font-black uppercase tracking-tight" style={{ color: meta.color }}>
                {meta.label}
              </div>
              <div className="text-sm text-[#8080A0] mt-0.5">{meta.desc}</div>
            </div>
          </div>

          {/* Quick mode switcher */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(MODE_META) as [string, typeof MODE_META.off][]).map(([m, v]) => (
              <button
                key={m}
                onClick={() => updateMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
                style={{
                  background: m === mode ? `${v.color}25` : 'transparent',
                  color: m === mode ? v.color : '#4A4A60',
                  border: `1px solid ${m === mode ? v.color + '40' : '#23232F'}`,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Eventos hoy',
            value: stats?.today.total_events ?? events.length,
            icon: Activity,
            color: '#3B82F6',
          },
          {
            label: 'Alertas hoy',
            value: todayAlerts,
            icon: AlertTriangle,
            color: todayAlerts > 0 ? '#FFB800' : '#4A4A60',
          },
          {
            label: 'Dispositivos',
            value: devices.filter((d) => d.enabled).length,
            icon: Radio,
            color: '#A78BFA',
          },
          {
            label: 'Estado',
            value: wsConnected ? 'En vivo' : 'Offline',
            icon: wsConnected ? Wifi : WifiOff,
            color: wsConnected ? '#00D084' : '#FF3B3B',
            isText: true,
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#12121A] border border-[#1A1A24] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-xs text-[#8080A0]">{stat.label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Hourly activity chart + devices ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white">Actividad — últimas 24h</div>
              <div className="text-xs text-[#8080A0]">eventos por hora</div>
            </div>
            <div className="text-xs font-mono text-[#3B82F6]">
              {stats?.week.total_events ?? 0} esta semana
            </div>
          </div>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#1A1A24', border: '1px solid #23232F', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#F0F0F8' }}
                  labelFormatter={(v) => `${v}:00h`}
                />
                <Area
                  type="monotone" dataKey="count" stroke="#3B82F6"
                  fill="url(#actGrad)" strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-xs text-[#4A4A60]">
              Sin datos aún
            </div>
          )}
        </div>

        {/* Device tiles */}
        <div className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Dispositivos</div>
            <Link to="/cameras" className="text-xs text-[#3B82F6] hover:text-[#60A5FA]">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {devices.length === 0 ? (
              <div className="text-xs text-[#4A4A60] text-center py-6">
                Cargando dispositivos...
              </div>
            ) : (
              devices.slice(0, 4).map((device) => {
                const lastEvent = events.find((e) => e.device_id === device.device_id)
                const alertColor = ALERT_COLOR[lastEvent?.alert_level ?? 'none']
                return (
                  <div key={device.id} className="flex items-center gap-3 bg-[#16161F] rounded-xl p-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: `${alertColor}20` }}
                    >
                      {device.device_type === 'tapo_camera' ? '📷' : '👁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{device.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin size={10} className="text-[#4A4A60]" />
                        <span className="text-[10px] text-[#4A4A60]">{device.zone ?? 'sin zona'}</span>
                      </div>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: device.enabled ? '#00D084' : '#4A4A60' }}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Recent events feed ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">Actividad reciente</div>
          <Link to="/timeline" className="text-xs text-[#3B82F6] hover:text-[#60A5FA]">Ver todo →</Link>
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-[#4A4A60] text-sm">
                Sin eventos aún. {config ? 'El Sheriff está monitoreando.' : 'Cargando...'}
              </div>
            ) : (
              recentEvents.map((event, idx) => {
                const level = event.alert_level
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="alert-ribbon rounded-r-xl rounded-l-sm border border-[#1A1A24] border-l-0 p-3 flex items-center gap-3"
                    data-level={level}
                  >
                    <span className="text-base">{EVENT_ICON[event.event_type] ?? '📡'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {event.device_name ?? event.device_id}
                      </div>
                      <div className="text-[10px] text-[#8080A0] mt-0.5">
                        {event.event_type.replace(/_/g, ' ')} · {event.zone ?? '—'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {level !== 'none' && (
                        <div
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1"
                          style={{ background: `${ALERT_COLOR[level]}20`, color: ALERT_COLOR[level] }}
                        >
                          {level}
                        </div>
                      )}
                      <div className="text-[10px] text-[#4A4A60] font-mono">
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

      {/* ── Zones by activity ── */}
      {stats?.by_zone && stats.by_zone.length > 0 && (
        <div className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-5">
          <div className="text-sm font-semibold text-white mb-4">
            <Eye size={14} className="inline mr-2 text-[#3B82F6]" />
            Zonas más activas — últimas 24h
          </div>
          <div className="space-y-2">
            {stats.by_zone.slice(0, 5).map((z) => {
              const max = stats.by_zone[0]?.count ?? 1
              const pct = Math.round((z.count / max) * 100)
              return (
                <div key={z.zone} className="flex items-center gap-3">
                  <div className="text-xs text-[#8080A0] w-24 truncate capitalize">{z.zone}</div>
                  <div className="flex-1 h-2 bg-[#1A1A24] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-[#3B82F6] rounded-full"
                    />
                  </div>
                  <div className="text-xs font-mono text-[#8080A0] w-6 text-right">{z.count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
