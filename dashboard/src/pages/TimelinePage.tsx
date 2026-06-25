import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { EventData, FilterLevel } from '../types'
import { X, ChevronRight, Brain, Shield } from 'lucide-react'

const LEVELS: FilterLevel[] = ['all', 'critical', 'high', 'medium', 'low', 'none']

const LEVEL_LABELS: Record<string, string> = {
  all: 'Todos', none: 'Normal', low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico',
}

export default function TimelinePage() {
  const events       = useStore((s) => s.events)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const [filter, setFilter]   = useState<FilterLevel>('all')
  const [selected, setSelected] = useState<EventData | null>(null)

  useEffect(() => {
    if (events.length === 0) fetchInitial()
  }, [events.length, fetchInitial])

  const filtered = filter === 'all' ? events : events.filter((e) => e.alert_level === filter)

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Eventos</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {filtered.length} registros
        </p>
      </div>

      {/* Pill filters — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {LEVELS.map((lvl) => {
          const active = filter === lvl
          const count  = lvl === 'all' ? events.length : events.filter((e) => e.alert_level === lvl).length
          return (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all"
              style={active
                ? {
                    background: lvl === 'all' ? 'var(--accent-subtle)' : `var(--level-${lvl}-bg)`,
                    color: lvl === 'all' ? 'var(--accent-text)' : `var(--level-${lvl})`,
                    border: `1px solid ${lvl === 'all' ? 'var(--accent-border)' : `var(--level-${lvl}-border)`}`,
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }
              }
            >
              {LEVEL_LABELS[lvl]}
              <span style={{ opacity: 0.6, fontSize: '10px' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Event list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface-raised)' }}
              >
                <Shield size={22} style={{ color: 'var(--text-disabled)' }} />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-disabled)' }}>
                Sin eventos con este filtro
              </span>
            </div>
          ) : (
            filtered.map((event, idx) => (
              <EventRow key={event.id} event={event} index={idx} onClick={() => setSelected(event)} />
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}

function EventRow({ event, index, onClick }: { event: EventData; index: number; onClick: () => void }) {
  const level = event.alert_level

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25) }}
      onClick={onClick}
      className="w-full text-left ribbon rounded-r-xl rounded-l-sm p-3 transition-all"
      data-level={level}
      style={{ outline: 'none' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface-overlay)' }}
        >
          <Shield size={16} style={{ color: `var(--level-${level})` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {event.device_name ?? event.device_id}
            </span>
            {level !== 'none' && (
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ background: `var(--level-${level}-bg)`, color: `var(--level-${level})` }}
              >
                {level}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {event.zone ?? '—'}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-disabled)' }}>
              {event.event_type.replace(/_/g, ' ')}
            </span>
          </div>
          {event.sheriff_evaluated && event.sheriff_decision?.reasoning && (
            <div className="flex items-start gap-1 mt-1">
              <Brain size={10} className="shrink-0 mt-0.5" style={{ color: 'var(--accent-text)' }} />
              <span className="text-[11px] line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                {event.sheriff_decision.reasoning}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right flex flex-col items-end gap-1">
          <div className="text-[11px] font-mono" style={{ color: 'var(--text-disabled)' }}>
            {new Date(event.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>
            {new Date(event.timestamp).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
          </div>
          <ChevronRight size={12} style={{ color: 'var(--text-disabled)' }} />
        </div>
      </div>
    </motion.button>
  )
}

function EventModal({ event, onClose }: { event: EventData; onClose: () => void }) {
  const level = event.alert_level
  const d     = event.sheriff_decision

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
        style={{
          background: 'var(--surface-raised)',
          borderTop: '1px solid var(--border-default)',
          paddingBottom: `calc(1.25rem + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `var(--level-${level}-bg)`, border: `1px solid var(--level-${level}-border)` }}
            >
              <Shield size={18} style={{ color: `var(--level-${level})` }} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {event.device_name ?? event.device_id}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {event.event_type.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase mb-4"
          style={{
            background: `var(--level-${level}-bg)`,
            color: `var(--level-${level})`,
            border: `1px solid var(--level-${level}-border)`,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: `var(--level-${level})` }} />
          {level}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Zona',         value: event.zone ?? '—' },
            { label: 'Dispositivo',  value: event.device_id },
            { label: 'Timestamp',    value: new Date(event.timestamp).toLocaleString('es-PE') },
            { label: 'Evaluado IA',  value: event.sheriff_evaluated ? 'Sí' : 'No' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-3"
              style={{ background: 'var(--surface-overlay)' }}
            >
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-disabled)' }}>
                {item.label}
              </div>
              <div className="text-xs font-mono break-all" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {d && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
              <Brain size={13} /> Análisis del Sheriff IA
            </div>
            {d.reasoning && (
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-disabled)' }}>
                  Razonamiento
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{d.reasoning}</p>
              </div>
            )}
            {d.message && (
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-disabled)' }}>
                  Mensaje
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{d.message}</p>
              </div>
            )}
            {d.recommended_action && (
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-disabled)' }}>
                  Acción recomendada
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--status-warn)' }}>{d.recommended_action}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  )
}
