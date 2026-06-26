import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Shield, Server, Bell, Key, Info, ExternalLink } from 'lucide-react'
import { API } from '../store'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, paddingLeft: 2 }}>
      {children}
    </div>
  )
}

function Row({
  icon: Icon,
  iconColor = '--text-tertiary',
  label,
  value,
  valueOk,
  last = false,
  action,
}: {
  icon?: React.ElementType
  iconColor?: string
  label: string
  value?: string
  valueOk?: boolean | null
  last?: boolean
  action?: React.ReactNode
}) {
  const valueColor = valueOk === true
    ? 'var(--status-safe)'
    : valueOk === false
    ? 'var(--status-alert)'
    : 'var(--text-secondary)'

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '15px 20px', minHeight: 60,
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      {Icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-overlay)',
        }}>
          <Icon size={16} style={{ color: `var(${iconColor})` }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-primary)' }}>{label}</span>
      </div>
      {action ?? (
        value !== undefined && (
          <span style={{ fontSize: 13, fontFamily: 'monospace', color: valueColor, textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </span>
        )
      )}
    </div>
  )
}

export default function SettingsPage() {
  const health        = useStore((s) => s.health)
  const sheriffStatus = useStore((s) => s.sheriffStatus)
  const config        = useStore((s) => s.config)
  const fetchInitial  = useStore((s) => s.fetchInitial)

  const [pushSupported] = useState('serviceWorker' in navigator && 'PushManager' in window)
  const [pushPermission, setPushPermission] = useState(Notification.permission)
  const [vapidKey, setVapidKey]             = useState('')
  const [requestingPush, setRequestingPush] = useState(false)

  useEffect(() => {
    if (!health) fetchInitial()
    fetchVapidKey()
  }, [health, fetchInitial])

  async function fetchVapidKey() {
    try {
      const res = await fetch(`${API}/api/v1/push/vapid-key`)
      if (res.ok) { const d = await res.json(); setVapidKey(d.public_key ?? '') }
    } catch { /* silent */ }
  }

  async function enablePush() {
    if (!pushSupported || !vapidKey) return
    setRequestingPush(true)
    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      await fetch(`${API}/api/v1/push/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh') as ArrayBuffer))),
            auth:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth') as ArrayBuffer))),
          },
          device_label: navigator.userAgent.slice(0, 50),
        }),
      })
    } catch (e) { console.error('Push error:', e) }
    setRequestingPush(false)
  }

  function urlBase64ToUint8Array(b64: string) {
    const padding = '='.repeat((4 - b64.length % 4) % 4)
    const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw     = window.atob(base64)
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Ajustes
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
          Configuración del sistema
        </p>
      </div>

      {/* Sheriff IA */}
      <div>
        <SectionLabel>Sheriff IA</SectionLabel>
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
          <Row icon={Shield} iconColor="--accent-text" label="Modo actual" value={config?.mode?.toUpperCase() ?? '—'} />
          <Row icon={Shield} label="Claude" value={sheriffStatus?.claude_available ? 'Disponible ✓' : 'Sin API key'} valueOk={sheriffStatus?.claude_available} />
          <Row icon={Shield} label="OpenAI" value={sheriffStatus?.openai_available ? 'Disponible ✓' : 'Sin API key'} valueOk={sheriffStatus?.openai_available} />
          <Row label="Cooldown" value={`${config?.cooldown_minutes ?? '—'} min`} />
          <Row label="Escalación" value={config?.escalation_enabled ? 'Activada' : 'Desactivada'} last />
        </div>
      </div>

      {/* Sistema */}
      <div>
        <SectionLabel>Sistema</SectionLabel>
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
          <Row icon={Server} iconColor="--text-secondary" label="Versión backend" value={health?.version ?? '—'} />
          <Row label="Sensores" value={health?.mock_sensors ? 'MOCK (simulación)' : 'LIVE (hardware)'} valueOk={!health?.mock_sensors} />
          <Row label="RF service" value={(health?.services?.rf as { running?: boolean })?.running ? 'Activo' : 'Inactivo'} valueOk={(health?.services?.rf as { running?: boolean })?.running} />
          <Row label="Tapo service" value={(health?.services?.tapo as { running?: boolean })?.running ? 'Activo' : 'Inactivo'} valueOk={(health?.services?.tapo as { running?: boolean })?.running} />
          <Row label="Orange Pi" value="192.168.68.100" last />
        </div>
      </div>

      {/* Variables de entorno */}
      <div>
        <SectionLabel>Credenciales</SectionLabel>
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
          <Row icon={Key} iconColor="--status-safe" label="ANTHROPIC_API_KEY" value={sheriffStatus?.claude_available ? '••••••••' : 'No configurada'} valueOk={sheriffStatus?.claude_available} />
          <Row label="OPENAI_API_KEY" value={sheriffStatus?.openai_available ? '••••••••' : 'No configurada'} valueOk={sheriffStatus?.openai_available} />
          <Row label="VAPID_PUBLIC_KEY" value={vapidKey ? '••••••••' : 'No configurada'} valueOk={!!vapidKey} />
          <Row label="MOCK_SENSORS" value={health?.mock_sensors ? 'true' : 'false'} last />
        </div>
      </div>

      {/* Notificaciones Push */}
      <div>
        <SectionLabel>Notificaciones Push</SectionLabel>
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
          <Row
            icon={Bell} iconColor="--status-warn"
            label="Soporte Web Push"
            value={pushSupported ? 'Soportado' : 'No soportado'}
            valueOk={pushSupported}
          />
          <Row
            label="Permiso"
            value={pushPermission}
            valueOk={pushPermission === 'granted' ? true : pushPermission === 'denied' ? false : null}
          />
          <Row
            label="VAPID key"
            value={vapidKey ? 'Configurada ✓' : 'No configurada'}
            valueOk={!!vapidKey}
            last={!(pushSupported && pushPermission !== 'granted' && vapidKey)}
          />
          {pushSupported && pushPermission !== 'granted' && vapidKey && (
            <div style={{ padding: '16px 20px' }}>
              <button
                onClick={enablePush}
                disabled={requestingPush}
                style={{
                  width: '100%', padding: '14px', borderRadius: 16, cursor: 'pointer',
                  fontSize: 15, fontWeight: 600,
                  background: 'var(--status-warn)', color: 'var(--surface-base)',
                  opacity: requestingPush ? 0.5 : 1,
                }}
              >
                {requestingPush ? 'Configurando...' : 'Activar notificaciones push'}
              </button>
            </div>
          )}
          {pushPermission === 'granted' && (
            <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: 13, color: 'var(--status-safe)' }}>
              ✓ Notificaciones activas
            </div>
          )}
        </div>
        {!pushSupported && (
          <div style={{ marginTop: 10, padding: '0 4px', fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.5 }}>
            iOS: instala desde Safari → Compartir → Añadir a pantalla de inicio (iOS 16.4+).
          </div>
        )}
      </div>

      {/* Acerca de */}
      <div>
        <SectionLabel>Acerca de</SectionLabel>
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
          <Row icon={Info} iconColor="--text-disabled" label="Sheriff Home" value="v0.2.0" />
          <Row label="Alonso Javier · Lima · 2026" last
            action={
              <a
                href="https://github.com/alonsix33/VerisureSix6"
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent-text)', textDecoration: 'none' }}
              >
                GitHub <ExternalLink size={12} />
              </a>
            }
          />
        </div>
      </div>

    </div>
  )
}
