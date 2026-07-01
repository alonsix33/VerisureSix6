import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Camera, Eye, Door, Wind, WifiHigh, Broadcast, GearSix, WifiNone } from '@phosphor-icons/react'
import HomeMap from '../components/HomeMap'
import BottomSheet from '../components/BottomSheet'
import type { Device } from '../types'
import { relTime } from '../lib/design'

function DeviceIcon({ type, size = 20, color = 'currentColor' }: { type: string; size?: number; color?: string }) {
  const props = { size, weight: 'duotone' as const, color }
  switch (type) {
    case 'tapo_camera':   return <Camera {...props} />
    case 'tapo_hub':      return <WifiHigh {...props} />
    case 'verisure_pir':  return <Eye {...props} />
    case 'verisure_door': return <Door {...props} />
    case 'verisure_smoke':return <Wind {...props} />
    case 'rf_sensor':     return <Broadcast {...props} />
    default:              return <GearSix {...props} />
  }
}

function brandOf(type: string): string {
  if (type.startsWith('tapo')) return 'Tapo'
  if (type.startsWith('verisure')) return 'Verisure'
  return type.split('_')[0]
}

const ZONE_LABELS: Record<string, string> = {
  sala: 'Sala', cocina: 'Cocina', balcon: 'Balcón', balcón: 'Balcón',
  entrada: 'Entrada', dormitorio: 'Dormitorio', nucleo: 'Núcleo', núcleo: 'Núcleo',
}

export default function CamerasPage() {
  const devices      = useStore((s) => s.devices)
  const loading      = useStore((s) => s.loading)
  const fetchInitial = useStore((s) => s.fetchInitial)

  const [selected, setSelected] = useState<Device | null>(null)

  useEffect(() => {
    if (devices.length === 0) fetchInitial()
  }, [devices.length, fetchInitial])

  const online  = devices.filter((d) => d.enabled).length

  return (
    <div style={{ padding: '58px 18px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#2C2723', letterSpacing: '-0.4px' }}>
          Tu hogar
        </div>
        <div style={{ fontSize: 13, color: '#7A7065', marginTop: 3 }}>
          {online} de {devices.length} cuidando · {new Set(devices.map((d) => d.zone).filter(Boolean)).size || 5} zonas
        </div>
      </div>

      {/* Floor plan */}
      <div style={{
        margin: '0 0 18px', padding: 16,
        borderRadius: 22,
        background: '#FFFCF6',
        border: '1px solid rgba(80,60,40,0.08)',
        boxShadow: '0 8px 22px rgba(80,55,25,0.06)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#7A7065', marginBottom: 14 }}>Plano del hogar</div>
        <HomeMap />
      </div>

      {/* Devices */}
      {loading ? (
        <LoadingSkeleton />
      ) : devices.length === 0 ? (
        <EmptyDevices />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {devices.map((d) => {
            const isCam = d.device_type === 'tapo_camera'
            const dotColor = d.enabled ? '#7E9466' : '#ADA293'
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                style={{
                  position: 'relative', padding: 14, borderRadius: 20,
                  background: '#FFFCF6', border: '1px solid rgba(80,60,40,0.08)',
                  boxShadow: '0 6px 18px rgba(80,55,25,0.05)',
                  width: '100%', textAlign: 'left', overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: isCam ? 54 : 44, height: isCam ? 54 : 44, borderRadius: 14, flexShrink: 0,
                    background: d.enabled ? 'rgba(126,148,102,0.12)' : 'rgba(168,155,140,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: d.enabled ? '#7E9466' : '#ADA293',
                    border: isCam ? '1px solid rgba(80,60,40,0.10)' : 'none',
                  }}>
                    <DeviceIcon type={d.device_type} size={isCam ? 24 : 20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#2C2723' }}>
                        {d.name}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
                        <span style={{ fontSize: 11, color: dotColor }}>
                          {d.enabled ? 'Online' : 'Offline'}
                        </span>
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#ADA293', marginTop: 3 }}>
                      {ZONE_LABELS[d.zone?.toLowerCase() ?? ''] ?? d.zone ?? 'Sin zona'} · {brandOf(d.device_type)} · {d.protocol}
                    </div>
                    {d.battery_level !== undefined && d.battery_level !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
                        <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(80,60,40,0.1)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${d.battery_level}%`,
                            background: d.battery_level > 30 ? '#7E9466' : '#C26248',
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#ADA293', fontVariantNumeric: 'tabular-nums' }}>{d.battery_level}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTop: '1px solid rgba(80,60,40,0.06)' }}>
                  <span style={{ fontSize: 11, color: '#ADA293' }}>
                    {d.last_seen ? relTime(d.last_seen) : 'Sin actividad reciente'}
                  </span>
                  {isCam && (
                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      style={{
                        fontSize: 11, fontWeight: 600, color: '#B47B2A',
                        background: 'rgba(223,162,81,0.12)', border: '1px solid rgba(223,162,81,0.25)',
                        padding: '5px 12px', borderRadius: 9999, cursor: 'pointer',
                      }}
                    >
                      Ver en vivo
                    </button>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Device detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && <DeviceDetail device={selected} />}
      </BottomSheet>

    </div>
  )
}

function DeviceDetail({ device: d }: { device: Device }) {
  return (
    <div style={{ padding: '10px 22px 34px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: d.enabled ? 'rgba(126,148,102,0.12)' : 'rgba(168,155,140,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: d.enabled ? 'var(--status-safe)' : 'var(--text-tertiary)',
        }}>
          <DeviceIcon type={d.device_type} size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {d.device_id}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 18 }}>
        {[
          { label: 'ESTADO', val: d.enabled ? 'En línea' : 'Sin señal' },
          { label: 'ZONA', val: ZONE_LABELS[d.zone?.toLowerCase() ?? ''] ?? d.zone ?? '—' },
          { label: 'TIPO', val: d.device_type.replace(/_/g, ' ') },
          { label: 'BATERÍA', val: d.battery_level !== undefined && d.battery_level !== null ? `${d.battery_level}%` : '—' },
        ].map((item) => (
          <div key={item.label} style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-input)' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>{item.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 14px', borderRadius: 'var(--radius-md)',
        background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
        fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center',
      }}>
        {d.last_seen ? `Última actividad: ${d.last_seen}` : 'Sin actividad reciente'}
      </div>
    </div>
  )
}

function EmptyDevices() {
  return (
    <div style={{ textAlign: 'center', padding: '56px 32px' }}>
      <WifiNone size={42} style={{ color: '#ADA293', marginBottom: 12 }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 7 }}>
        Sin dispositivos
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        Los sensores y cámaras aparecerán aquí cuando sean detectados.
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="anim-shimmer" style={{ height: 76, borderRadius: 'var(--radius-md)' }} />
      ))}
    </div>
  )
}
