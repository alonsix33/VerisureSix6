import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { EventData, FilterLevel } from '../types'
import { X, Filter, ChevronRight, Brain, MapPin } from 'lucide-react'

const LEVELS: FilterLevel[] = ['all', 'critical', 'high', 'medium', 'low', 'none']

const LEVEL_META: Record<string, { color: string; label: string }> = {
  all:      { color: '#8080A0', label: 'Todos' },
  none:     { color: '#4A4A60', label: 'Normal' },
  low:      { color: '#00D084', label: 'Bajo' },
  medium:   { color: '#FFB800', label: 'Medio' },
  high:     { color: '#FF3B3B', label: 'Alto' },
  critical: { color: '#FF3B3B', label: 'Crítico' },
}

const EVENT_ICON: Record<string, string> = {
  motion_detected:  '👁',
  camera_snapshot:  '📷',
  zone_crossed:     '🚶',
  alarm_triggered:  '🚨',
  system_heartbeat: '💓',
}

export default function TimelinePage() {
  const events       = useStore((s) => s.events)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const [filter, setFilter] = useState<FilterLevel>('all')
  const [selected, setSelected] = useState<EventData | null>(null)

  useEffect(() => {
    if (events.length === 0) fetchInitial()
  }, [events.length, fetchInitial])

  const filtered = filter === 'all' ? events : events.filter((e) => e.alert_level === filter)

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Eventos</h1>
          <p className="text-xs text-[#8080A0] mt-0.5">{filtered.length} registros</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-[#4A4A60]" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {LEVELS.map((lvl) => {
          const meta = LEVEL_META[lvl]
          const active = filter === lvl
          const count = lvl === 'all' ? events.length : events.filter((e) => e.alert_level === lvl).length
          return (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: active ? `${meta.color}20` : 'transparent',
                color: active ? meta.color : '#8080A0',
                border: `1px solid ${active ? meta.color + '40' : '#23232F'}`,
              }}
            >
              {meta.label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Event list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#4A4A60] text-sm">
              No hay eventos con este filtro.
            </div>
          ) : (
            filtered.map((event, idx) => (
              <EventRow
                key={event.id}
                event={event}
                index={idx}
                onClick={() => setSelected(event)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <EventModal event={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function EventRow({ event, index, onClick }: { event: EventData; index: number; onClick: () => void }) {
  const level = event.alert_level
  const meta = LEVEL_META[level] ?? LEVEL_META.none

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onClick={onClick}
      className="w-full text-left alert-ribbon rounded-r-xl rounded-l-sm border border-[#1A1A24] border-l-0 p-3 hover:brightness-110 transition-all"
      data-level={level}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{EVENT_ICON[event.event_type] ?? '📡'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {event.device_name ?? event.device_id}
            </span>
            {level !== 'none' && (
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ background: `${meta.color}20`, color: meta.color }}
              >
                {level}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-[#4A4A60]" />
              <span className="text-[11px] text-[#8080A0]">{event.zone ?? '—'}</span>
            </div>
            <span className="text-[11px] text-[#4A4A60]">
              {event.event_type.replace(/_/g, ' ')}
            </span>
          </div>
          {event.sheriff_evaluated && event.sheriff_decision?.reasoning && (
            <div className="flex items-start gap-1 mt-1.5">
              <Brain size={10} className="text-[#A78BFA] mt-0.5 shrink-0" />
              <span className="text-[11px] text-[#8080A0] line-clamp-1">
                {event.sheriff_decision.reasoning}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-mono text-[#4A4A60]">
            {new Date(event.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] text-[#3A3A50] mt-0.5">
            {new Date(event.timestamp).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
          </div>
          <ChevronRight size={12} className="text-[#3A3A50] ml-auto mt-1" />
        </div>
      </div>
    </motion.button>
  )
}

function EventModal({ event, onClose }: { event: EventData; onClose: () => void }) {
  const level = event.alert_level
  const meta = LEVEL_META[level] ?? LEVEL_META.none
  const d = event.sheriff_decision

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121A] border-t border-[#23232F] rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{EVENT_ICON[event.event_type] ?? '📡'}</span>
            <div>
              <div className="text-sm font-bold text-white">{event.device_name ?? event.device_id}</div>
              <div className="text-xs text-[#8080A0]">{event.event_type.replace(/_/g, ' ')}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4A4A60] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase mb-4"
          style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
          {meta.label}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Zona', value: event.zone ?? '—' },
            { label: 'Dispositivo', value: event.device_id },
            { label: 'Timestamp', value: new Date(event.timestamp).toLocaleString('es-PE') },
            { label: 'Evaluado por IA', value: event.sheriff_evaluated ? 'Sí' : 'No' },
          ].map((item) => (
            <div key={item.label} className="bg-[#0E0E16] rounded-xl p-3">
              <div className="text-[10px] text-[#4A4A60] uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xs font-mono text-white break-all">{item.value}</div>
            </div>
          ))}
        </div>

        {d && (
          <div className="bg-[#0E0E16] border border-[#23232F] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA]">
              <Brain size={14} /> Análisis del Sheriff IA
            </div>
            <div>
              <div className="text-[10px] text-[#4A4A60] uppercase tracking-wider mb-1">Razonamiento</div>
              <p className="text-sm text-[#C0C0D8]">{d.reasoning}</p>
            </div>
            {d.message && (
              <div>
                <div className="text-[10px] text-[#4A4A60] uppercase tracking-wider mb-1">Mensaje</div>
                <p className="text-sm text-white">{d.message}</p>
              </div>
            )}
            {d.recommended_action && (
              <div>
                <div className="text-[10px] text-[#4A4A60] uppercase tracking-wider mb-1">Acción recomendada</div>
                <p className="text-sm text-[#FFB800]">{d.recommended_action}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  )
}
