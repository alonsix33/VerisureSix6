import { useEffect, useState } from 'react'
import { useStore } from '../store'
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const MODE_LABELS: Record<string, string> = {
  off: 'Desactivado',
  monitor: 'Monitoreo',
  normal: 'Normal',
  away: 'Fuera',
  travel: 'Viaje',
}

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
    } catch {
      // ignore
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-lg font-bold text-white">Configuración del Sheriff</h1>

      {/* Mode selector */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Modo de operación
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(MODE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              disabled={saving}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === key
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Current config info */}
      {config && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Estado actual
          </h2>
          <ConfigRow label="Umbral visión" value={String(config.vision_threshold)} />
          <ConfigRow label="Cooldown" value={`${config.cooldown_minutes} min`} />
          <ConfigRow
            label="Escalación"
            value={config.escalation_enabled ? 'Activada' : 'Desactivada'}
          />
          <ConfigRow
            label="Zonas ignoradas"
            value={config.ignored_zones?.join(', ') || 'Ninguna'}
          />
          <ConfigRow
            label="Zonas alerta"
            value={config.alert_zones?.join(', ') || 'Todas'}
          />
          <ConfigRow
            label="Última actualización"
            value={new Date(config.updated_at).toLocaleString('es-PE')}
          />
        </section>
      )}
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  )
}
