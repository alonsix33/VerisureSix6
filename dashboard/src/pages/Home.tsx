import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  Activity, AlertTriangle, Shield, Wifi, WifiOff,
  Eye, ChevronRight, Radio, MapPin,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'

const MODE_META = {
  off:     { label: 'Apagado',  desc: 'Sistema inactivo' },
  monitor: { label: 'Monitor',  desc: 'Solo registra' },
  casa:    { label: 'Casa',     desc: 'Alguien en casa' },
  fuera:   { label: 'Fuera',    desc: 'Casa vacía' },
  noche:   { label: 'Noche',    desc: 'Todos durmiendo' },
  viaje:   { label: 'Viaje',    desc: 'Máxima alerta' },
} as const

/* ─── Section label ─────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, paddingLeft: 2 }}>
      {children}
    </div>
  )
}

/* ─── List item row ─────────────────────────────── */
function ListRow({
  icon: Icon,
  iconBg = 'var(--surface-overlay)',
  iconColor = 'var(--text-tertiary)',
  title,
  subtitle,
  right,
  last = false,
}: {
  icon: React.ElementType
  iconBg?: string
  iconColor?: string
  title: string
  subtitle?: string
  right?: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0',
        minHeight: 60,
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          width: 42, height: 42, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: iconBg,
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  )
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

  const todayEvents = stats?.today.total_events ?? events.length
  const todayAlerts = stats?.today.alerts ?? events.filter((e) => {
    const today = new Date().toISOString().slice(0, 10)
    return e.timestamp?.startsWith(today) && e.alert_level !== 'none'
  }).length

  const recentEvents  = events.slice(0, 5)
  const hourlyData    = stats?.by_hour ?? []

  if (loading && events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div className="skeleton" style={{ height: 160, borderRadius: 24 }} />
        <div className="skeleton" style={{ height: 96, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <motion.div
        layout
        style={{
          background: `var(--mode-${mode}-bg)`,
          border: `1px solid var(--mode-${mode}-border)`,
          borderRadius: 24,
          padding: '28px 24px',
        }}
      >
        {/* Top row: icon + status chip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div
            style={{
              width: 60, height: 60, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `var(--mode-${mode}-bg)`,
              border: `1.5px solid var(--mode-${mode}-border)`,
              position: 'relative',
            }}
          >
            <Shield size={28} style={{ color: `var(--mode-${mode})` }} />
            {wsConnected && (
              <div
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 14, height: 14, borderRadius: 7,
                  background: 'var(--status-safe)',
                  boxShadow: '0 0 0 2.5px var(--surface-base)',
                }}
              />
            )}
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: wsConnected ? 'var(--status-safe-bg)' : 'var(--status-offline-bg)',
              border: `1px solid ${wsConnected ? 'var(--status-safe-border)' : 'var(--status-offline-border)'}`,
            }}
          >
            {wsConnected
              ? <Wifi size={12} style={{ color: 'var(--status-safe)' }} />
              : <WifiOff size={12} style={{ color: 'var(--status-offline)' }} />
            }
            <span style={{ fontSize: 12, fontWeight: 600, color: wsConnected ? 'var(--status-safe)' : 'var(--status-offline)' }}>
              {wsConnected ? 'En vivo' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Mode info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
            Modo activo
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', color: `var(--mode-${mode})`, lineHeight: 1.05, marginBottom: 6 }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
            {meta.desc}
          </div>
        </div>

        {/* Mode switcher: horizontal scroll */}
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
            Cambiar modo
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {(Object.entries(MODE_META) as [string, typeof MODE_META.off][]).map(([m, v]) => (
              <button
                key={m}
                onClick={() => updateMode(m)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: m === mode ? `var(--mode-${m}-bg)` : 'transparent',
                  color: m === mode ? `var(--mode-${m})` : 'var(--text-tertiary)',
                  border: `1px solid ${m === mode ? `var(--mode-${m}-border)` : 'var(--border-subtle)'}`,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══ HOY ═══════════════════════════════════════════ */}
      <div>
        <SectionLabel>Hoy</SectionLabel>

        {/* Split stats card */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'Eventos', value: todayEvents, icon: Activity, color: '--accent-text' },
            { label: 'Alertas',  value: todayAlerts,  icon: AlertTriangle, color: todayAlerts > 0 ? '--status-warn' : '--text-disabled' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: '22px 20px',
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <stat.icon size={14} style={{ color: `var(${stat.color})` }} />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: `var(${stat.color})`, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        {hourlyData.length > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '16px 20px 12px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Actividad — últimas 24h</span>
              <span style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
                {stats?.week.total_events ?? 0} esta semana
              </span>
            </div>
            <ResponsiveContainer width="100%" height={72}>
              <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-default)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-default)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10, fontSize: 11,
                    color: 'var(--text-primary)',
                  }}
                  labelFormatter={(v) => `${v}:00h`}
                  itemStyle={{ color: 'var(--accent-text)' }}
                />
                <Area
                  type="monotone" dataKey="count"
                  stroke="var(--accent-default)" fill="url(#chartGrad)"
                  strokeWidth={2} dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ══ DISPOSITIVOS ══════════════════════════════════ */}
      {devices.length > 0 && (
        <div>
          <SectionLabel>Dispositivos</SectionLabel>
          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18,
              padding: '0 20px',
              overflow: 'hidden',
            }}
          >
            {devices.slice(0, 4).map((device, idx) => {
              const lastEvent = events.find((e) => e.device_id === device.device_id)
              const hasAlert  = lastEvent && lastEvent.alert_level !== 'none'
              return (
                <ListRow
                  key={device.id}
                  icon={device.device_type === 'tapo_camera' ? Eye : Radio}
                  iconBg={hasAlert ? 'var(--status-warn-bg)' : 'var(--surface-overlay)'}
                  iconColor={hasAlert ? 'var(--status-warn)' : 'var(--accent-text)'}
                  title={device.name}
                  subtitle={device.zone ?? 'sin zona'}
                  last={idx === Math.min(devices.length, 4) - 1}
                  right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 8, height: 8, borderRadius: 4,
                          background: device.enabled ? 'var(--status-safe)' : 'var(--text-disabled)',
                        }}
                      />
                    </div>
                  }
                />
              )
            })}
            <Link
              to="/cameras"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '14px 0',
                fontSize: 13, fontWeight: 500, color: 'var(--accent-text)',
                borderTop: '1px solid var(--border-subtle)',
                textDecoration: 'none',
              }}
            >
              Ver todos los dispositivos <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* ══ EVENTOS RECIENTES ════════════════════════════ */}
      <div>
        <SectionLabel>Eventos recientes</SectionLabel>
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          {recentEvents.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: 14 }}>
              {config ? 'Sheriff monitoreando. Sin eventos.' : 'Cargando...'}
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {recentEvents.map((event, idx) => {
                  const level = event.alert_level
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 20px',
                        minHeight: 60,
                        borderLeft: `3px solid var(--level-${level})`,
                        borderBottom: idx < recentEvents.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: level !== 'none' ? `var(--level-${level}-bg)` : 'transparent',
                      }}
                    >
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--surface-overlay)',
                        }}
                      >
                        <Eye size={16} style={{ color: `var(--level-${level})` }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.device_name ?? event.device_id}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {event.event_type.replace(/_/g, ' ')} · {event.zone ?? '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {level !== 'none' && (
                          <span
                            style={{
                              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              padding: '2px 8px', borderRadius: 10,
                              background: `var(--level-${level}-bg)`,
                              color: `var(--level-${level})`,
                            }}
                          >
                            {level}
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-disabled)' }}>
                          {new Date(event.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <Link
                to="/timeline"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '14px 0',
                  fontSize: 13, fontWeight: 500, color: 'var(--accent-text)',
                  borderTop: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                }}
              >
                Ver todos los eventos <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ══ ZONAS ════════════════════════════════════════ */}
      {stats?.by_zone && stats.by_zone.length > 0 && (
        <div>
          <SectionLabel>Zonas más activas</SectionLabel>
          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18,
              padding: '20px 20px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            {stats.by_zone.slice(0, 5).map((z) => {
              const max = stats.by_zone[0]?.count ?? 1
              const pct = Math.round((z.count / max) * 100)
              return (
                <div key={z.zone} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80, flexShrink: 0 }}>
                    <MapPin size={11} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.zone}
                    </span>
                  </div>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface-float)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 3,
                        background: pct > 75 ? 'var(--status-warn)' : 'var(--accent-default)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-tertiary)', width: 20, textAlign: 'right', flexShrink: 0 }}>
                    {z.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
