import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { EventData, FilterLevel } from '../types'
import { X, ChevronRight, Brain, Shield, Eye } from 'lucide-react'

const LEVELS: FilterLevel[] = ['all', 'critical', 'high', 'medium', 'low', 'none']

const LEVEL_LABELS: Record<string, string> = {
  all: 'Todos', none: 'Normal', low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, paddingLeft: 2 }}>
      {children}
    </div>
  )
}

export default function TimelinePage() {
  const events       = useStore((s) => s.events)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const [filter, setFilter]     = useState<FilterLevel>('all')
  const [selected, setSelected] = useState<EventData | null>(null)

  useEffect(() => {
    if (events.length === 0) fetchInitial()
  }, [events.length, fetchInitial])

  const filtered = filter === 'all' ? events : events.filter((e) => e.alert_level === filter)

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Eventos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
          {filtered.length} registros
        </p>
      </div>

      {/* Filter pills — horizontal scroll, no wrap */}
      <div>
        <SectionLabel>Filtrar</SectionLabel>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {LEVELS.map((lvl) => {
            const active = filter === lvl
            const count  = lvl === 'all' ? events.length : events.filter((e) => e.alert_level === lvl).length
            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 22, whiteSpace: 'nowrap', flexShrink: 0,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  background: active
                    ? lvl === 'all' ? 'var(--accent-subtle)' : `var(--level-${lvl}-bg)`
                    : 'var(--surface-raised)',
                  color: active
                    ? lvl === 'all' ? 'var(--accent-text)' : `var(--level-${lvl})`
                    : 'var(--text-tertiary)',
                  border: `1px solid ${active
                    ? lvl === 'all' ? 'var(--accent-border)' : `var(--level-${lvl}-border)`
                    : 'var(--border-subtle)'}`,
                }}
              >
                {LEVEL_LABELS[lvl]}
                <span
                  style={{
                    fontSize: 11, fontWeight: 600,
                    background: 'rgba(255,255,255,0.08)',
                    padding: '1px 6px', borderRadius: 10,
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Event list */}
      <div>
        <SectionLabel>Registros</SectionLabel>
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 20px', textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface-overlay)',
                }}>
                  <Shield size={24} style={{ color: 'var(--text-disabled)' }} />
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-disabled)' }}>
                  Sin eventos con este filtro
                </span>
              </div>
            ) : (
              filtered.map((event, idx) => (
                <EventRow
                  key={event.id}
                  event={event}
                  index={idx}
                  last={idx === filtered.length - 1}
                  onClick={() => setSelected(event)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}

function EventRow({ event, index, last, onClick }: {
  event: EventData; index: number; last: boolean; onClick: () => void
}) {
  const level = event.alert_level

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px',
        minHeight: 64,
        borderLeft: `3px solid var(--level-${level})`,
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
        background: level !== 'none' ? `var(--level-${level}-bg)` : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-overlay)',
      }}>
        <Eye size={17} style={{ color: `var(--level-${level})` }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.device_name ?? event.device_id}
          </span>
          {level !== 'none' && (
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 10, flexShrink: 0,
              background: `var(--level-${level}-bg)`, color: `var(--level-${level})`,
            }}>
              {level}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>{event.zone ?? '—'}</span>
          <span style={{ color: 'var(--text-disabled)' }}>·</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.event_type.replace(/_/g, ' ')}
          </span>
        </div>
        {event.sheriff_evaluated && event.sheriff_decision?.reasoning && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 4 }}>
            <Brain size={10} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {event.sheriff_decision.reasoning}
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-disabled)' }}>
          {new Date(event.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
          {new Date(event.timestamp).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
        </span>
        <ChevronRight size={14} style={{ color: 'var(--text-disabled)' }} />
      </div>
    </motion.button>
  )
}

function EventModal({ event, onClose }: { event: EventData; onClose: () => void }) {
  const level = event.alert_level
  const d = event.sheriff_decision

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)' }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-default)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
          maxHeight: '80dvh', overflowY: 'auto',
        }}
      >
        {/* Pull handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '-12px auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `var(--level-${level}-bg)`,
              border: `1px solid var(--level-${level}-border)`,
            }}>
              <Shield size={22} style={{ color: `var(--level-${level})` }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.device_name ?? event.device_id}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {event.event_type.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Level badge */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 24, marginBottom: 24,
            background: `var(--level-${level}-bg)`,
            border: `1px solid var(--level-${level}-border)`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 4, background: `var(--level-${level})` }} />
          <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: `var(--level-${level})` }}>
            {level}
          </span>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Zona',        value: event.zone ?? '—' },
            { label: 'Dispositivo', value: event.device_id },
            { label: 'Timestamp',   value: new Date(event.timestamp).toLocaleString('es-PE') },
            { label: 'Evaluado IA', value: event.sheriff_evaluated ? 'Sí' : 'No' },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'var(--surface-overlay)', borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* AI analysis */}
        {d && (
          <div style={{
            background: 'var(--surface-overlay)',
            border: '1px solid var(--accent-border)',
            borderRadius: 16, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>
              <Brain size={14} /> Análisis Sheriff IA
            </div>
            {d.reasoning && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>Razonamiento</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{d.reasoning}</p>
              </div>
            )}
            {d.message && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>Mensaje</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{d.message}</p>
              </div>
            )}
            {d.recommended_action && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>Acción recomendada</div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--status-warn)' }}>{d.recommended_action}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  )
}
