import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Camera, MapPin, RefreshCw, Wifi, Battery } from 'lucide-react'
import HomeMap from '../components/HomeMap'
import { API } from '../store'

const DEVICE_TYPE_ICON: Record<string, string> = {
  verisure_pir:  '👁',
  tapo_camera:   '📷',
  verisure_hub:  '📡',
  tapo_hub:      '🔌',
}

export default function CamerasPage() {
  const devices    = useStore((s) => s.devices)
  const events     = useStore((s) => s.events)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const [snapping, setSnapping] = useState<string | null>(null)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)

  useEffect(() => {
    if (devices.length === 0) fetchInitial()
  }, [devices.length, fetchInitial])

  async function requestSnapshot(deviceId: string) {
    setSnapping(deviceId)
    try {
      const res = await fetch(`${API}/api/v1/tapo/snapshot`, { method: 'POST' })
      const data = await res.json()
      if (data.url) setSnapshotUrl(data.url)
    } catch { /* silent */ }
    setSnapping(null)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dispositivos & Zonas</h1>
        <p className="text-xs text-[#8080A0] mt-0.5">{devices.length} dispositivos registrados</p>
      </div>

      {/* Home map */}
      <div className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Mapa del hogar</div>
        <HomeMap />
      </div>

      {/* Devices grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {devices.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-[#4A4A60] text-sm">
            Cargando dispositivos...
          </div>
        ) : (
          devices.map((device, idx) => {
            const lastEvent = events.find((e) => e.device_id === device.device_id)
            const isCamera = device.device_type === 'tapo_camera'
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#16161F] border border-[#23232F] flex items-center justify-center text-xl shrink-0">
                    {DEVICE_TYPE_ICON[device.device_type] ?? '📱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{device.name}</span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: device.enabled ? '#00D084' : '#4A4A60' }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={10} className="text-[#4A4A60]" />
                      <span className="text-[11px] text-[#8080A0]">{device.zone ?? 'sin zona'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[#4A4A60] font-mono">{device.protocol.toUpperCase()}</span>
                      {device.battery_level !== null && (
                        <div className="flex items-center gap-1">
                          <Battery size={10} className="text-[#4A4A60]" />
                          <span className="text-[10px] text-[#8080A0]">{device.battery_level}%</span>
                        </div>
                      )}
                      {device.signal_strength !== null && (
                        <div className="flex items-center gap-1">
                          <Wifi size={10} className="text-[#4A4A60]" />
                          <span className="text-[10px] text-[#8080A0]">{device.signal_strength}dBm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last event */}
                {lastEvent && (
                  <div className="mt-3 pt-3 border-t border-[#1A1A24]">
                    <div className="text-[10px] text-[#4A4A60] uppercase tracking-wider mb-1">Último evento</div>
                    <div className="text-xs text-[#8080A0]">
                      {lastEvent.event_type.replace(/_/g, ' ')} ·{' '}
                      {new Date(lastEvent.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}

                {/* Snapshot button for cameras */}
                {isCamera && (
                  <button
                    onClick={() => requestSnapshot(device.device_id)}
                    disabled={snapping === device.device_id}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#16161F] border border-[#23232F] text-xs text-[#8080A0] hover:text-white hover:border-[#3B82F6]/30 transition-all disabled:opacity-50"
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
        <div className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-4">
          <div className="text-sm font-semibold text-white mb-3">Último snapshot</div>
          <img src={snapshotUrl} alt="Snapshot" className="w-full rounded-xl object-cover max-h-64" />
        </div>
      )}
    </div>
  )
}
