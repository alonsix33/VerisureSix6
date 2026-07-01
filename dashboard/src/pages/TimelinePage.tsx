import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { alertToLevel, fmtTime, relTime, eventTypeName } from '../lib/design'
import BottomSheet from '../components/BottomSheet'
import { Camera, Eye, GearSix, Tray } from '@phosphor-icons/react'
import type { EventData } from '../types'

type FilterLevel = 'todos' | 'importante' | 'atencion' | 'rutina' | 'info'

const FILTERS: { id: FilterLevel; label: string }[] = [
  { id: 'todos',      label: 'Todos'      },
  { id: 'importante', label: 'Importante' },
  { id: 'atencion',   label: 'Atención'   },
  { id: 'rutina',     label: 'Rutina'     },
  { id: 'info',       label: 'Info'       },
]

function eventMatchesFilter(ev: EventData, f: FilterLevel): boolean {
  if (f === 'todos')      return true
  if (f === 'importante') return ev.alert_level === 'critical' || ev.alert_level === 'high'
  if (f === 'atencion')   return ev.alert_level === 'medium'
  if (f === 'rutina')     return ev.alert_level === 'low'
  return ev.alert_level === 'none'
}

function DeviceIcon({ type }: { type?: string }) {
  const size = 20
  if (type?.includes('camera')) return <Camera size={size} weight="duotone" />
  if (type?.includes('pir') || type?.includes('motion')) return <Eye size={size} weight="duotone" />
  return <GearSix size={size} weight="duotone" />
}

export default function TimelinePage() {
  const events       = useStore((s) => s.events)
  const loading      = useStore((s) => s.loading)
  const fetchInitial = useStore((s) => s.fetchInitial)

  const [filter, setFilter]     = useState<FilterLevel>('todos')
  const [selected, setSelected] = useState<EventData | null>(null)

  useEffect(() => {
    if (events.length === 0) fetchInitial()
  }, [events.length, fetchInitial])

  const filtered = events.filter((e) => eventMatchesFilter(e, filter))

  const counts: Record<FilterLevel, number> = {
    todos:      events.length,
    importante: events.filter((e) => eventMatchesFilter(e, 'importante')).length,
    atencion:   events.filter((e) => eventMatchesFilter(e, 'atencion')).length,
    rutina:     events.filter((e) => eventMatchesFilter(e, 'rutina')).length,
    info:       events.filter((e) => eventMatchesFilter(e, 'info')).length,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '58px 18px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', color: '#2C2723' }}>
          Lo que pasó hoy
        </div>
        <div style={{ fontSize: 13, color: '#7A7065', marginTop: 3 }}>
          {filtered.length} momentos · un día tranquilo en casa
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 18px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => {
          const active = f.id === filter
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                borderRadius: 9999,
                background: active ? 'var(--accent-subtle)' : 'var(--surface-card)',
                border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border-medium)'}`,
                cursor: 'pointer', transition: 'background 200ms ease, border-color 200ms ease',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent-dark)' : 'var(--text-secondary)' }}>
                {f.label}
              </span>
              <span style={{ fontSize: 11, color: active ? 'var(--accent-dark)' : 'var(--text-secondary)', opacity: 0.65, fontVariantNumeric: 'tabular-nums' }}>
                {counts[f.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Event list */}
      <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((ev, i) => {
            const lv   = alertToLevel(ev.alert_level)
            const prev = filtered[i - 1]
            const showDate = i === 0 || new Date(ev.timestamp).toDateString() !== new Date(prev?.timestamp ?? '').toDateString()

            return (
              <div key={ev.id}>
                {showDate && (
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-tertiary)', padding: '8px 4px 4px', textTransform: 'uppercase' }}>
                    {formatDate(ev.timestamp)}
                  </div>
                )}
                <button
                  onClick={() => setSelected(ev)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 13,
                    width: '100%', textAlign: 'left',
                    padding: 14, borderRadius: 16,
                    background: lv.bg,
                    border: 'none',
                    borderLeft: `4px solid ${lv.color}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#FFFCF6', color: lv.color,
                  }}>
                    <DeviceIcon type={ev.event_type} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#2C2723' }}>
                        {ev.device_name ?? ev.device_id}
                      </span>
                      <span style={{ fontSize: 11, color: '#ADA293', whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {relTime(ev.timestamp)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#7A7065', marginTop: 3 }}>
                      {eventTypeName(ev.event_type)} · {ev.zone ?? 'Sin zona'}
                    </div>
                    {ev.sheriff_decision?.reasoning && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 11, background: 'rgba(223,162,81,0.10)', border: '1px solid rgba(223,162,81,0.20)' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.6px', color: '#B47B2A', flexShrink: 0, marginTop: 2 }}>SHERIFF</span>
                        <span style={{ fontSize: 12, lineHeight: 1.45, color: '#6B6258' }}>
                          {ev.sheriff_decision.reasoning.slice(0, 120)}{ev.sheriff_decision.reasoning.length > 120 ? '…' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Event detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && <TimelineEventDetail ev={selected} />}
      </BottomSheet>
    </div>
  )
}

function TimelineEventDetail({ ev }: { ev: EventData }) {
  const lv = alertToLevel(ev.alert_level)
  const d  = ev.sheriff_decision
  return (
    <div style={{ padding: '10px 22px 34px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 15,
          background: lv.bg, border: `1px solid ${lv.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: lv.color,
        }}>
          <DeviceIcon type={ev.event_type} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: lv.bg, fontSize: 10, fontWeight: 700, color: lv.text, marginBottom: 6, textTransform: 'uppercase' }}>
            {lv.label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev.device_name ?? ev.device_id}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'ZONA', val: ev.zone ?? '—' },
          { label: 'TIPO', val: eventTypeName(ev.event_type) },
          { label: 'HORA', val: fmtTime(ev.timestamp) },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, padding: 11, borderRadius: 'var(--radius-sm)', background: 'var(--surface-input)' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</div>
          </div>
        ))}
      </div>

      {d?.reasoning && (
        <div style={{ marginBottom: 14, padding: 14, borderRadius: 15, background: 'var(--level-atencion-bg)', border: '1px solid rgba(223,162,81,0.20)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--accent-dark)', marginBottom: 7, textTransform: 'uppercase' }}>Sheriff te cuenta</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{d.reasoning}</div>
        </div>
      )}

      {d?.recommended_action && (
        <div style={{ padding: 14, borderRadius: 15, background: 'var(--level-rutina-bg)', border: '1px solid rgba(126,148,102,0.25)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--status-safe-dark)', marginBottom: 6, textTransform: 'uppercase' }}>Qué puedes hacer</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--level-rutina-text)' }}>{d.recommended_action}</div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px 30px' }}>
      <Tray size={42} style={{ color: '#ADA293', marginBottom: 16 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#7A7065' }}>Nada de este tipo hoy</div>
      <div style={{ fontSize: 13, color: '#ADA293', marginTop: 4 }}>Eso casi siempre es buena señal.</div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="anim-shimmer" style={{ height: 80, borderRadius: 16 }} />
      ))}
    </>
  )
}

function formatDate(ts: string): string {
  const d   = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Hoy'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
