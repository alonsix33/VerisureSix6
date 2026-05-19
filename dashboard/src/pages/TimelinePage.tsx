import { useEffect, useState } from 'react'
import { useStore } from '../store'
import EventTimeline from '../components/EventTimeline'
import { RefreshCw, Search, Radio } from 'lucide-react'
import type { FilterLevel } from '../types'

const LEVELS: { key: FilterLevel; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'critical', label: 'Crítica' },
  { key: 'high', label: 'Alta' },
  { key: 'medium', label: 'Media' },
  { key: 'low', label: 'Baja' },
  { key: 'none', label: 'Normal' },
]

const LEVEL_COLORS: Record<string, string> = {
  all: 'bg-blue-600 text-white',
  critical: 'bg-red-600 text-white',
  high: 'bg-red-600 text-white',
  medium: 'bg-orange-600 text-white',
  low: 'bg-yellow-600 text-white',
  none: 'bg-slate-600 text-white',
}

export default function TimelinePage() {
  const events = useStore((s) => s.events)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const loading = useStore((s) => s.loading)
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all')
  const [searchZone, setSearchZone] = useState('')

  useEffect(() => {
    if (events.length === 0) fetchInitial()
  }, [events.length, fetchInitial])

  const zones = [...new Set(events.map((e) => e.zone).filter(Boolean))] as string[]

  const filtered = filterLevel === 'all'
    ? events
    : events.filter((e) => e.alert_level === filterLevel)

  const searched = searchZone
    ? filtered.filter((e) => e.zone?.toLowerCase().includes(searchZone.toLowerCase()))
    : filtered

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio size={22} className="text-[var(--md-primary)]" />
          <h1 className="text-[var(--md-title-lg)] font-bold text-[var(--md-on-surface)] tracking-tight">
            Timeline
          </h1>
        </div>
        <button
          onClick={() => fetchInitial()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
            bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]
            hover:bg-[var(--md-surface-container-highest)] hover:text-[var(--md-on-surface)]
            disabled:opacity-40 transition-all duration-200"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Cargando' : 'Actualizar'}
        </button>
      </div>

      {/* Filter chips — M3 style */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() => setFilterLevel(l.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              filterLevel === l.key
                ? LEVEL_COLORS[l.key] || 'bg-blue-600 text-white shadow-md'
                : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-highest)]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {l.key !== 'all' && (
                <span className={`w-1.5 h-1.5 rounded-full ${
                  l.key === 'critical' || l.key === 'high' ? 'bg-current' :
                  l.key === 'medium' ? 'bg-current' :
                  l.key === 'low' ? 'bg-current' : 'bg-current'
                }`} />
              )}
              {l.label}
            </span>
          </button>
        ))}
      </div>

      {/* Zone search */}
      {zones.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
          <input
            value={searchZone}
            onChange={(e) => setSearchZone(e.target.value)}
            placeholder="Filtrar por zona..."
            className="w-full bg-[var(--md-surface-container-low)] border border-[var(--md-outline)] rounded-full pl-9 pr-4 py-2.5 text-sm text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)] focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Event list */}
      {loading && events.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="md-card p-3 animate-pulse">
              <div className="h-4 w-3/4 bg-[var(--md-surface-container-high)] rounded mb-2" />
              <div className="h-3 w-1/2 bg-[var(--md-surface-container-high)] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <EventTimeline events={searched} showAll />
      )}

      {/* Count */}
      <div className="text-xs text-center text-[var(--md-on-surface-variant)]">
        {searched.length} eventos
        {filterLevel !== 'all' && ` · nivel: ${filterLevel}`}
        {searchZone && ` · zona: ${searchZone}`}
      </div>
    </div>
  )
}
