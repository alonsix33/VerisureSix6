import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Camera, MapPin, RefreshCw, Wifi, Battery, Eye, Radio } from 'lucide-react'
import HomeMap from '../components/HomeMap'
import { API } from '../store'

const DEVICE_ICON: Record<string, typeof Eye> = {
  verisure_pir: Eye,
  tapo_camera:  Camera,
  verisure_hub: Radio,
  tapo_hub:     Radio,
}

export default function CamerasPage() {
  const devices      = useStore((s) => s.devices)
  const events       = useStore((s) => s.events)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const [snapping, setSnapping]       = useState<string | null>(null)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)

  useEffect(() => {
    if (devices.length === 0) fetchInitial()
  }, [devices.length, fetchInitial])

  async function requestSnapshot(deviceId: string) {
    setSnapping(deviceId)
    try {
      const res  = await fetch(`${API}/api/v1/tapo/snapshot`, { method: 'POST' })
      const data = await res.json()
      if (data.url) setSnapshotUrl(data.url)
    } catch { /* silent */ }
    setSnapping(null)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dispositivos y Zonas
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {devices.length} dispositivos registrados
        </p>
      </div>

      {/* Home map */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Mapa del hogar
        </div>
        <HomeMap />
      </div>

      {/* Device cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {devices.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-sm" style={{ color: 'var(--text-disabled)' }}>
            Cargando dispositivos...
          </div>
        ) : (
          devices.map((device, idx) => {
            const lastEvent = events.find((e) => e.device_id === device.device_id)
            const isCamera  = device.device_type === 'tapo_camera'
            const DevIcon   = DEVICE_ICON[device.device_type] ?? Eye
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl p-4"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)' }}
                  >
                    <DevIcon size={18} style={{ color: device.enabled ? 'var(--accent-text)' : 'var(--text-disabled)' }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {device.name}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: device.enabled ? 'var(--status-safe)' : 'var(--text-disabled)' }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={10} style={{ color: 'var(--text-disabled)' }} />
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {device.zone ?? 'sin zona'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--surface-float)', color: 'var(--text-tertiary)' }}
                      >
                        {device.protocol.toUpperCase()}
                      </span>
                      {device.battery_level !== null && (
                        <div className="flex items-center gap-1">
                          <Battery size={10} style={{ color: 'var(--text-disabled)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {device.battery_level}%
                          </span>
                        </div>
                      )}
                      {device.signal_strength !== null && (
                        <div className="flex items-center gap-1">
                          <Wifi size={10} style={{ color: 'var(--text-disabled)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {device.signal_strength}dBm
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last event */}
                {lastEvent && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-wider mb-1"
                      style={{ color: 'var(--text-disabled)' }}
                    >
                      Último evento
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {lastEvent.event_type.replace(/_/g, ' ')} ·{' '}
                      {new Date(lastEvent.timestamp).toLocaleTimeString('es-PE', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}

                {/* Snapshot button */}
                {isCamera && (
                  <button
                    onClick={() => requestSnapshot(device.device_id)}
                    disabled={snapping === device.device_id}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                    style={{
                      background: 'var(--surface-overlay)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {snapping === device.device_id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Camera size={12} />
                    )}
                    Solicitar snapshot
                  </button>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* Snapshot preview */}
      {snapshotUrl && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Último snapshot
          </div>
          <img src={snapshotUrl} alt="Snapshot" className="w-full rounded-xl object-cover max-h-64" />
        </div>
      )}
    </div>
  )
}
