import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { CaretRight, Camera, Eye, GearSix, Bell, X, Check } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import { MODE_META, MODE_COLOR_RAW, alertToLevel, relTime, buildChart, fmtTime, eventTypeName } from '../lib/design'
import type { EventData } from '../types'

const MODES = ['off', 'monitor', 'casa', 'fuera', 'noche', 'viaje']

const ZONE_LABELS: Record<string, string> = {
  sala: 'Sala', cocina: 'Cocina', balcon: 'Balcón', balcón: 'Balcón',
  entrada: 'Entrada', dormitorio: 'Dormitorio', nucleo: 'Núcleo', núcleo: 'Núcleo',
}

const ZONE_COLORS = [
  'var(--level-importante)', 'var(--level-atencion)', 'var(--level-atencion)',
  'var(--status-offline)', 'var(--status-safe)',
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días,'
  if (h < 19) return 'Buenas tardes,'
  return 'Buenas noches,'
}

export default function Home() {
  const navigate     = useNavigate()
  const events       = useStore((s) => s.events)
  const devices      = useStore((s) => s.devices)
  const config       = useStore((s) => s.config)
  const stats        = useStore((s) => s.stats)
  const loading      = useStore((s) => s.loading)
  const updateMode   = useStore((s) => s.updateSheriffMode)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const fetchStats   = useStore((s) => s.fetchStats)

  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [eventSheet, setEventSheet]       = useState<EventData | null>(null)
  const [errDismiss, setErrDismiss]       = useState(false)

  useEffect(() => {
    fetchInitial()
    fetchStats()
  }, [fetchInitial, fetchStats])

  const mode        = config?.mode ?? 'fuera'
  const modeColor   = MODE_COLOR_RAW[mode] ?? MODE_COLOR_RAW.fuera
  const modeMeta    = MODE_META[mode] ?? MODE_META.fuera

  const recentEvents    = events.slice(0, 5)
  const importantCount  = events.filter((e) => e.alert_level === 'critical' || e.alert_level === 'high').length
  const todayEvents     = stats?.today.total_events ?? 0
  const todayAlerts     = stats?.today.alerts ?? 0
  const onlineDevices   = devices.filter((d) => d.enabled).length

  const byHour  = stats?.by_hour ?? []
  const chart   = buildChart(byHour)
  const byZone  = (stats?.by_zone ?? []).slice(0, 5)
  const maxZone = Math.max(...byZone.map((z) => z.count), 1)

  if (loading) return <LoadingSkeleton />

  return (
    <div style={{ padding: '56px 18px 0', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{greeting()}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginTop: 1 }}>
            Alonso
          </div>
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--border-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--accent-dark)',
          flexShrink: 0,
        }}>
          A
        </div>
      </div>

      {/* Hero card */}
      <button
        onClick={() => setModeSheetOpen(true)}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          position: 'relative', overflow: 'hidden',
          borderRadius: 'var(--radius-2xl)',
          background: 'var(--surface-hero)',
          padding: 20, minHeight: 188,
          boxShadow: 'var(--shadow-hero)',
          marginBottom: 14,
        }}
      >
        <div
          className="anim-float"
          style={{
            position: 'absolute', top: -50, right: -40,
            width: 230, height: 230, borderRadius: '50%',
            background: `radial-gradient(circle, ${modeColor}99, transparent 66%)`,
            filter: 'blur(4px)', pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', borderRadius: 'var(--radius-pill)',
            background: 'rgba(242,234,221,0.10)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: modeColor, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#F2EADD' }}>Modo {modeMeta.label}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="anim-breathe" style={{ width: 7, height: 7, borderRadius: '50%', background: modeColor }} />
            <span style={{ fontSize: 12, color: 'rgba(242,234,221,0.55)' }}>En vivo</span>
          </span>
        </div>
        <div style={{ position: 'relative', marginTop: 46 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px',
            color: importantCount > 0 ? '#EFC07A' : '#F2EADD',
            lineHeight: 1.12, maxWidth: 250,
            transition: 'color var(--transition-mode)',
          }}>
            {importantCount > 0 ? 'Hay algo por revisar' : 'Todo está en calma'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(242,234,221,0.62)', marginTop: 9, maxWidth: 250 }}>
            {importantCount > 0
              ? `${importantCount} ${importantCount === 1 ? 'cosa necesita' : 'cosas necesitan'} tu mirada`
              : `${onlineDevices} dispositivos cuidando tu casa`}
          </div>
        </div>
      </button>

      {/* Error banner (warn) */}
      {!errDismiss && importantCount > 0 && (
        <div style={{
          marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '12px 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--level-atencion-bg)',
          border: '1px solid rgba(223,162,81,0.28)',
        }}>
          <span style={{ display: 'flex', color: '#B47B2A', flexShrink: 0 }}><Bell size={14} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {importantCount === 1 ? '1 evento necesita atención' : `${importantCount} eventos necesitan atención`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>Revisa la pantalla de eventos</div>
          </div>
          <button onClick={() => setErrDismiss(true)} style={{ color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0, padding: 2 }}><X size={14} /></button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {[
          { val: todayEvents, label: 'Eventos hoy', valColor: 'var(--text-primary)' },
          { val: onlineDevices, label: 'Zonas en calma', valColor: 'var(--status-safe)' },
        ].map((card) => (
          <div key={card.label} style={{
            flex: 1, padding: 16, borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: card.valColor, lineHeight: 1 }}>
              {card.val}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div style={{
        padding: 16, borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Cómo estuvo el día</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {todayAlerts > 0 ? `${todayAlerts} alertas` : 'Una tarde tranquila'}
          </span>
        </div>
        <svg width="100%" height="58" viewBox="0 0 322 58" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#DFA251" stopOpacity="0.30" />
              <stop offset="1" stopColor="#DFA251" stopOpacity="0" />
            </linearGradient>
          </defs>
          {byHour.length > 0 ? (
            <>
              <path d={chart.area} fill="url(#cg)" />
              <path d={chart.line} fill="none" stroke="#DFA251" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : (
            <rect x="0" y="27" width="322" height="2" rx="1" fill="rgba(223,162,81,0.22)" />
          )}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
          <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
        </div>
      </div>

      {/* Devices preview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Tu hogar</span>
          <button onClick={() => navigate('/cameras')} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 500, color: 'var(--accent-dark)' }}>
            Ver todo <CaretRight size={14} weight="bold" />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {devices.slice(0, 4).map((d) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: 13, borderRadius: 18,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: d.enabled ? 'rgba(126,148,102,0.12)' : 'rgba(168,155,140,0.10)',
                flexShrink: 0,
                color: d.enabled ? 'var(--status-safe)' : 'var(--text-tertiary)',
              }}>
                {d.device_type === 'tapo_camera' ? <Camera size={18} weight="duotone" /> :
                 d.device_type === 'verisure_pir' ? <Eye size={18} weight="duotone" /> :
                 <GearSix size={18} weight="duotone" />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: d.enabled ? 'var(--status-safe)' : 'var(--status-offline)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.enabled ? 'En línea' : 'Sin señal'}</span>
                </div>
              </div>
            </div>
          ))}
          {devices.length === 0 && [0, 1, 2, 3].map((i) => (
            <div key={i} className="anim-shimmer" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>

      {/* Recent events */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Hoy en casa</span>
          <button onClick={() => navigate('/timeline')} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 500, color: 'var(--accent-dark)' }}>
            Ver todo <CaretRight size={14} weight="bold" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {recentEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', fontSize: 14, color: 'var(--text-tertiary)' }}>
              Sin eventos recientes
            </div>
          ) : recentEvents.map((ev) => {
            const lv = alertToLevel(ev.alert_level)
            return (
              <button
                key={ev.id}
                onClick={() => setEventSheet(ev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', textAlign: 'left',
                  padding: '13px 14px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: lv.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.device_name ?? ev.device_id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {ev.zone ? (ZONE_LABELS[ev.zone.toLowerCase()] ?? ev.zone) : 'Sin zona'} · {eventTypeName(ev.event_type)}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                  {relTime(ev.timestamp)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Zone bars */}
      {byZone.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 14, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            Movimiento por zona
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {byZone.map((z, i) => (
              <div key={z.zone} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 84, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {ZONE_LABELS[z.zone.toLowerCase()] ?? z.zone}
                </span>
                <div style={{ flex: 1, height: 9, borderRadius: 'var(--radius-pill)', background: 'rgba(80,60,40,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 'var(--radius-pill)',
                    background: ZONE_COLORS[i] ?? 'var(--accent)',
                    width: `${(z.count / maxZone) * 100}%`,
                    transition: 'width 600ms ease',
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 32, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {z.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mode Sheet ── */}
      <BottomSheet open={modeSheetOpen} onClose={() => setModeSheetOpen(false)}>
        <div style={{ padding: '4px 18px 30px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', padding: '6px 4px 4px' }}>
            ¿Cómo cuido tu casa?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '0 4px 16px' }}>
            Elige el modo según dónde estés.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {MODES.map((m) => {
              const meta    = MODE_META[m]
              const color   = MODE_COLOR_RAW[m]
              const isActive = m === mode
              return (
                <button
                  key={m}
                  onClick={() => { updateMode(m); setModeSheetOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 15,
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? `${color}14` : 'var(--surface-card)',
                    border: `1px solid ${isActive ? `${color}66` : 'var(--border-default)'}`,
                    textAlign: 'left', transition: 'background var(--transition-base)',
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{meta.desc}</div>
                  </div>
                  {isActive && <Check size={16} weight="bold" style={{ color, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </div>
      </BottomSheet>

      {/* ── Event Sheet ── */}
      <BottomSheet open={!!eventSheet} onClose={() => setEventSheet(null)}>
        {eventSheet && <EventDetail ev={eventSheet} />}
      </BottomSheet>

    </div>
  )
}

function EventDetail({ ev }: { ev: EventData }) {
  const lv = alertToLevel(ev.alert_level)
  const d  = ev.sheriff_decision
  return (
    <div style={{ padding: '10px 22px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
        <div style={{ width: 50, height: 50, borderRadius: 15, background: lv.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bell size={22} style={{ color: lv.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: lv.bg, fontSize: 10, fontWeight: 700, color: lv.text, marginBottom: 6 }}>
            {lv.label.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev.device_name ?? ev.device_id}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'ZONA', val: ev.zone ?? '—' },
          { label: 'DISPOSITIVO', val: ev.device_id },
          { label: 'HORA', val: fmtTime(ev.timestamp) },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, padding: 11, borderRadius: 'var(--radius-sm)', background: 'var(--surface-input)' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</div>
          </div>
        ))}
      </div>
      {d?.reasoning && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <span style={{ width: 22, height: 22, borderRadius: 8, background: 'radial-gradient(circle at 34% 30%, #E9B968, #DFA251)', display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--accent-dark)' }}>SHERIFF TE CUENTA</span>
          </div>
          <div style={{ padding: 14, borderRadius: 15, background: 'var(--level-atencion-bg)', border: '1px solid rgba(223,162,81,0.20)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            {d.reasoning}
          </div>
        </div>
      )}
      {d?.message && (
        <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.45, marginBottom: 16 }}>
          "{d.message}"
        </div>
      )}
      {d?.recommended_action && (
        <div style={{ padding: 14, borderRadius: 15, background: 'var(--level-rutina-bg)', border: '1px solid rgba(126,148,102,0.25)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--status-safe-dark)', marginBottom: 6 }}>QUÉ PUEDES HACER</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--level-rutina-text)' }}>{d.recommended_action}</div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '56px 18px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="anim-shimmer" style={{ height: 14, width: 120, borderRadius: 7, marginBottom: 10 }} />
          <div className="anim-shimmer" style={{ height: 26, width: 120, borderRadius: 8 }} />
        </div>
        <div className="anim-shimmer" style={{ width: 46, height: 46, borderRadius: '50%' }} />
      </div>
      <div className="anim-shimmer" style={{ height: 188, borderRadius: 'var(--radius-2xl)' }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="anim-shimmer" style={{ flex: 1, height: 88, borderRadius: 'var(--radius-lg)' }} />
        <div className="anim-shimmer" style={{ flex: 1, height: 88, borderRadius: 'var(--radius-lg)' }} />
      </div>
      <div className="anim-shimmer" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
    </div>
  )
}
