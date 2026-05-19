import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Shield, Sun, Moon, MapPin, Clock, Bell } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const MODES = [
  { key: 'off', label: 'Off', icon: Shield },
  { key: 'monitor', label: 'Monitoreo', icon: Shield },
  { key: 'normal', label: 'Casa', icon: Sun },
  { key: 'away', label: 'Fuera', icon: Shield },
  { key: 'travel', label: 'Viaje', icon: Moon },
] as const

export default function ConfigPage() {
  const config = useStore((s) => s.config)
  const [mode, setMode] = useState('monitor')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (config) setMode(config.mode)
  }, [config])

  async function handleModeChange(newMode: string) {
    setMode(newMode)
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/sheriff/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      })
      if (res.ok) useStore.getState().fetchInitial()
    } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-[var(--md-primary)]" />
        <h1 className="text-[var(--md-title-lg)] font-bold text-[var(--md-on-surface)] tracking-tight">
          Sheriff
        </h1>
      </div>

      {/* Mode selector — M3 segmented buttons style */}
      <section className="md-card p-4 space-y-3">
        <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] flex items-center gap-2">
          <Shield size={14} /> Modo de operación
        </h2>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  mode === m.key
                    ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-md'
                    : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-highest)]'
                } ${saving ? 'opacity-60' : ''}`}
              >
                <Icon size={16} />
                {m.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Current config info */}
      {config && (
        <section className="md-card p-4 divide-y divide-[var(--md-outline-variant)]">
          <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] pb-3 flex items-center gap-2">
            <Bell size={14} /> Estado
          </h2>

          <ConfigRow
            icon={MapPin}
            label="Zonas ignoradas"
            value={config.ignored_zones?.length
              ? config.ignored_zones.join(', ')
              : 'Ninguna'
            }
          />
          <ConfigRow
            icon={MapPin}
            label="Zonas de alerta"
            value={config.alert_zones?.length
              ? config.alert_zones.join(', ')
              : 'Todas'
            }
          />
          <ConfigRow
            icon={Clock}
            label="Cooldown"
            value={`${config.cooldown_minutes} min entre alertas`}
          />
          <ConfigRow
            icon={Shield}
            label="Escalación"
            value={config.escalation_enabled ? 'Activada' : 'Desactivada'}
          />
          <ConfigRow
            icon={Sun}
            label="Umbral visión"
            value={`${(config.vision_threshold * 100).toFixed(0)}%`}
          />
          <ConfigRow
            icon={Clock}
            label="Última actualización"
            value={new Date(config.updated_at).toLocaleString('es-PE')}
          />
        </section>
      )}

      {/* Schedule section */}
      {config?.schedule && (
        <section className="md-card p-4">
          <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] pb-3 flex items-center gap-2">
            <Clock size={14} /> Horarios
          </h2>
          <pre className="text-sm text-[var(--md-on-surface-variant)] whitespace-pre-wrap font-mono">
            {JSON.stringify(config.schedule, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}

function ConfigRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon size={15} className="text-[var(--md-on-surface-variant)] shrink-0" />
      <span className="text-sm text-[var(--md-on-surface-variant)] flex-1">{label}</span>
      <span className="text-sm text-[var(--md-on-surface)] text-right max-w-[55%] break-words">
        {value}
      </span>
    </div>
  )
}
