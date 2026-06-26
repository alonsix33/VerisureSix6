import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Camera, MapPin, RefreshCw, Wifi, Battery, Eye, Radio, ChevronRight } from 'lucide-react'
import HomeMap from '../components/HomeMap'
import { API } from '../store'

const DEVICE_ICON: Record<string, React.ElementType> = {
  verisure_pir: Eye,
  tapo_camera:  Camera,
  verisure_hub: Radio,
  tapo_hub:     Radio,
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, paddingLeft: 2 }}>
      {children}
    </div>
  )
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
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Dispositivos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
          {devices.length} dispositivos registrados
        </p>
      </div>

      {/* Floor map */}
      <div>
        <SectionLabel>Mapa del hogar</SectionLabel>
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20, overflow: 'hidden', padding: 20,
        }}>
          <HomeMap />
        </div>
      </div>

      {/* Device list */}
      <div>
        <SectionLabel>Dispositivos registrados</SectionLabel>
        {devices.length === 0 ? (
          <div style={{
            background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)',
            borderRadius: 18, padding: '48px 20px', textAlign: 'center',
            fontSize: 14, color: 'var(--text-disabled)',
          }}>
            Cargando dispositivos...
          </div>
        ) : (
          <div style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 18, overflow: 'hidden',
          }}>
            {devices.map((device, idx) => {
              const lastEvent = events.find((e) => e.device_id === device.device_id)
              const isCamera  = device.device_type === 'tapo_camera'
              const DevIcon   = DEVICE_ICON[device.device_type] ?? Eye

              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  {/* Device row */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 20px', minHeight: 72,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: device.enabled ? 'var(--accent-subtle)' : 'var(--surface-overlay)',
                      border: `1px solid ${device.enabled ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                    }}>
                      <DevIcon size={18} style={{ color: device.enabled ? 'var(--accent-text)' : 'var(--text-disabled)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {device.name}
                        </span>
                        <div style={{
                          width: 7, height: 7, borderRadius: 4, flexShrink: 0,
                          background: device.enabled ? 'var(--status-safe)' : 'var(--text-disabled)',
                        }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={10} style={{ color: 'var(--text-disabled)' }} />
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{device.zone ?? 'sin zona'}</span>
                        </div>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 6, background: 'var(--surface-float)', color: 'var(--text-tertiary)' }}>
                          {device.protocol.toUpperCase()}
                        </span>
                        {device.battery_level !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Battery size={10} style={{ color: 'var(--text-disabled)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{device.battery_level}%</span>
                          </div>
                        )}
                        {device.signal_strength !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Wifi size={10} style={{ color: 'var(--text-disabled)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{device.signal_strength}dBm</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={16} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
                  </div>

                  {/* Last event + snapshot */}
                  {(lastEvent || isCamera) && (
                    <div style={{ padding: '0 20px 16px', paddingLeft: 78 }}>
                      {lastEvent && (
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: isCamera ? 10 : 0 }}>
                          Último evento: {lastEvent.event_type.replace(/_/g, ' ')} ·{' '}
                          {new Date(lastEvent.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {isCamera && (
                        <button
                          onClick={() => requestSnapshot(device.device_id)}
                          disabled={snapping === device.device_id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 16px', borderRadius: 20, cursor: 'pointer',
                            fontSize: 13, fontWeight: 500,
                            color: 'var(--accent-text)',
                            background: 'var(--accent-subtle)',
                            border: '1px solid var(--accent-border)',
                            opacity: snapping === device.device_id ? 0.5 : 1,
                          }}
                        >
                          {snapping === device.device_id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Camera size={13} />
                          )}
                          Solicitar snapshot
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Snapshot preview */}
      {snapshotUrl && (
        <div>
          <SectionLabel>Último snapshot</SectionLabel>
          <div style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 18, overflow: 'hidden',
          }}>
            <img src={snapshotUrl} alt="Snapshot" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  )
}
