import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { Shield, Server, Bell, Key, Info, ExternalLink } from 'lucide-react'
import { API } from '../store'

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
      if (res.ok) {
        const data = await res.json()
        setVapidKey(data.public_key ?? '')
      }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh') as ArrayBuffer))),
            auth:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth') as ArrayBuffer))),
          },
          device_label: navigator.userAgent.slice(0, 50),
        }),
      })
    } catch (e) {
      console.error('Push subscription failed:', e)
    }
    setRequestingPush(false)
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw     = window.atob(base64)
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
  }

  type Section = {
    icon: typeof Shield
    tokenColor: string
    title: string
    items?: { label: string; value: string; ok?: boolean }[]
    custom?: React.ReactNode
  }

  const sections: Section[] = [
    {
      icon: Shield,
      tokenColor: '--accent-text',
      title: 'Sheriff IA',
      items: [
        { label: 'Modo actual',        value: config?.mode?.toUpperCase() ?? '—' },
        { label: 'Claude disponible',  value: sheriffStatus?.claude_available ? 'Sí ✓' : 'No — configurar ANTHROPIC_API_KEY', ok: sheriffStatus?.claude_available },
        { label: 'OpenAI disponible',  value: sheriffStatus?.openai_available ? 'Sí ✓' : 'No — configurar OPENAI_API_KEY',  ok: sheriffStatus?.openai_available },
        { label: 'Cooldown',           value: `${config?.cooldown_minutes ?? '—'} min` },
        { label: 'Escalación',         value: config?.escalation_enabled ? 'Activada' : 'Desactivada' },
      ],
    },
    {
      icon: Server,
      tokenColor: '--text-secondary',
      title: 'Sistema',
      items: [
        { label: 'Versión backend',  value: health?.version ?? '—' },
        { label: 'Modo sensores',    value: health?.mock_sensors ? 'MOCK (simulación)' : 'LIVE (hardware real)', ok: !health?.mock_sensors },
        { label: 'RF service',       value: (health?.services?.rf as { running?: boolean })?.running ? 'Activo' : 'Inactivo', ok: (health?.services?.rf as { running?: boolean })?.running },
        { label: 'Tapo service',     value: (health?.services?.tapo as { running?: boolean })?.running ? 'Activo' : 'Inactivo', ok: (health?.services?.tapo as { running?: boolean })?.running },
        { label: 'IP Orange Pi',     value: '192.168.68.100' },
      ],
    },
    {
      icon: Bell,
      tokenColor: '--status-warn',
      title: 'Notificaciones Push',
      custom: (
        <div className="space-y-3">
          {[
            {
              label: 'Soporte Web Push',
              value: pushSupported ? 'Soportado' : 'No soportado',
              ok: pushSupported,
            },
            {
              label: 'Permiso actual',
              value: pushPermission,
              ok: pushPermission === 'granted',
              warn: pushPermission === 'default',
            },
            {
              label: 'VAPID configurado',
              value: vapidKey ? 'Sí ✓' : 'No — configurar VAPID_PUBLIC_KEY',
              ok: !!vapidKey,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span
                className="text-xs font-mono"
                style={{
                  color: item.ok
                    ? 'var(--status-safe)'
                    : 'warn' in item && item.warn
                    ? 'var(--status-warn)'
                    : 'var(--status-alert)',
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
          {pushSupported && pushPermission !== 'granted' && vapidKey && (
            <button
              onClick={enablePush}
              disabled={requestingPush}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'var(--status-warn)', color: 'var(--surface-base)' }}
            >
              {requestingPush ? 'Configurando...' : 'Activar notificaciones push'}
            </button>
          )}
          {pushPermission === 'granted' && (
            <div className="text-xs text-center" style={{ color: 'var(--status-safe)' }}>
              ✓ Notificaciones push activas
            </div>
          )}
          {!pushSupported && (
            <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
              iOS: instala desde Safari → Compartir → Añadir a pantalla de inicio (requiere iOS 16.4+).
            </p>
          )}
        </div>
      ),
    },
    {
      icon: Key,
      tokenColor: '--status-safe',
      title: 'Variables de entorno',
      items: [
        { label: 'ANTHROPIC_API_KEY', value: sheriffStatus?.claude_available ? '••••••••' : 'No configurada', ok: sheriffStatus?.claude_available },
        { label: 'OPENAI_API_KEY',    value: sheriffStatus?.openai_available ? '••••••••' : 'No configurada',  ok: sheriffStatus?.openai_available },
        { label: 'VAPID_PUBLIC_KEY',  value: vapidKey ? '••••••••' : 'No configurada', ok: !!vapidKey },
        { label: 'MOCK_SENSORS',      value: health?.mock_sensors ? 'true' : 'false' },
      ],
    },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ajustes</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Configuración del sistema Sheriff Home
        </p>
      </div>

      {sections.map((section, idx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.07 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex items-center gap-2 mb-4 pb-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <section.icon size={15} style={{ color: `var(${section.tokenColor})` }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {section.title}
            </span>
          </div>

          {section.custom ?? (
            <div className="space-y-3">
              {section.items?.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {item.label}
                  </span>
                  <span
                    className="text-xs font-mono text-right truncate max-w-[55%]"
                    style={{
                      color: item.ok === true
                        ? 'var(--status-safe)'
                        : item.ok === false
                        ? 'var(--status-alert)'
                        : 'var(--text-primary)',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* About */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} style={{ color: 'var(--text-disabled)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Acerca de</span>
        </div>
        <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-disabled)' }}>
          <div>Sheriff Home v0.2.0 — Sistema de seguridad hogareña con IA</div>
          <div>Alonso Javier · Lima, Perú · 2026</div>
          <a
            href="https://github.com/alonsix33/VerisureSix6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 transition-colors"
            style={{ color: 'var(--accent-text)' }}
          >
            GitHub <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  )
}
