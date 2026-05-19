import { useState } from 'react'
import { useStore } from '../store'
import HomeMap from '../components/HomeMap'
import { Camera, Wifi, RefreshCw } from 'lucide-react'

export default function CamerasPage() {
  const snapshotUrl = useStore((s) => s.snapshotUrl)
  const setSnapshotUrl = useStore((s) => s.setSnapshotUrl)
  const devices = useStore((s) => s.devices)
  const [loading, setLoading] = useState(false)
  const [timestamp, setTimestamp] = useState('')

  async function handleSnapshot() {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/tapo/snapshot`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSnapshotUrl(data.url || null)
        setTimestamp(new Date().toLocaleString('es-PE'))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const activeDevices = devices.length > 0 ? devices : [
    { name: 'Hub Tapo H200', meta: '192.168.68.62 · Hub' },
    { name: 'Cámara Tapo C420', meta: 'Balcón · Cámara' },
    { name: 'Sensor ES700IPDE #1', meta: 'Sala · PIR con cámara' },
    { name: 'Sensor ES700IPDE #2', meta: 'Cocina · PIR con cámara' },
  ]

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Camera size={22} className="text-[var(--md-primary)]" />
        <h1 className="text-[var(--md-title-lg)] font-bold text-[var(--md-on-surface)] tracking-tight">
          Cámaras
        </h1>
      </div>

      <section className="md-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--md-outline-variant)]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-medium text-[var(--md-on-surface)]">Tapo C420</h3>
              <p className="text-xs text-[var(--md-on-surface-variant)]">Balcón — exterior</p>
            </div>
          </div>
          <button
            onClick={handleSnapshot}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
              bg-[var(--md-primary)] text-[var(--md-on-primary)]
              hover:bg-[var(--md-primary-container)]
              disabled:opacity-50 transition-all"
          >
            {loading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Camera size={15} />
            )}
            {loading ? 'Capturando...' : 'Tomar foto'}
          </button>
        </div>

        {snapshotUrl ? (
          <div className="p-4">
            <img src={snapshotUrl} alt="Snapshot" className="w-full rounded-[var(--md-shape-sm)]" />
            {timestamp && <p className="text-xs text-[var(--md-on-surface-variant)] mt-2">{timestamp}</p>}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Camera size={40} className="mx-auto text-[var(--md-surface-container-high)] mb-3" />
            <p className="text-sm text-[var(--md-on-surface-variant)]">Presiona "Tomar foto"</p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 opacity-60">
              Captura un snapshot desde la cámara del balcón
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] mb-3 px-1 flex items-center gap-2">
          <Camera size={14} /> Mapa del hogar
        </h2>
        <HomeMap />
      </section>

      <section>
        <h2 className="text-xs font-semibold text-[var(--md-on-surface-variant)] uppercase tracking-[0.08em] mb-3 px-1 flex items-center gap-2">
          <Wifi size={14} /> Dispositivos
        </h2>
        <div className="md-card divide-y divide-[var(--md-outline-variant)]">
          {activeDevices.map((d: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-[var(--md-on-surface)]">{d.name}</div>
                <div className="text-xs text-[var(--md-on-surface-variant)]">{d.meta}</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
