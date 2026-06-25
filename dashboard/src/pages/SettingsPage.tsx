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
  const [vapidKey, setVapidKey] = useState('')
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
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = window.atob(base64)
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
  }

  const sections = [
    {
      icon: Shield,
      color: '#3B82F6',
      title: 'Sheriff IA',
      items: [
        { label: 'Modo actual', value: config?.mode?.toUpperCase() ?? '—' },
        { label: 'Claude disponible', value: sheriffStatus?.claude_available ? 'Sí ✓' : 'No — configurar ANTHROPIC_API_KEY' },
        { label: 'OpenAI disponible', value: sheriffStatus?.openai_available ? 'Sí ✓' : 'No — configurar OPENAI_API_KEY' },
        { label: 'Cooldown', value: `${config?.cooldown_minutes ?? '—'} min` },
        { label: 'Escalación', value: config?.escalation_enabled ? 'Activada' : 'Desactivada' },
      ],
    },
    {
      icon: Server,
      color: '#A78BFA',
      title: 'Sistema',
      items: [
        { label: 'Versión backend', value: health?.version ?? '—' },
        { label: 'Modo sensores', value: health?.mock_sensors ? 'MOCK (simulación)' : 'LIVE (hardware real)' },
        { label: 'RF service', value: (health?.services?.rf as { running?: boolean })?.running ? 'Activo' : 'Inactivo' },
        { label: 'Tapo service', value: (health?.services?.tapo as { running?: boolean })?.running ? 'Activo' : 'Inactivo' },
        { label: 'IP Orange Pi', value: '192.168.68.100' },
      ],
    },
    {
      icon: Bell,
      color: '#FFB800',
      title: 'Notificaciones Push',
      custom: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8080A0]">Soporte Web Push</span>
            <span className={`text-xs font-mono ${pushSupported ? 'text-[#00D084]' : 'text-[#FF3B3B]'}`}>
              {pushSupported ? 'Soportado' : 'No soportado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8080A0]">Permiso actual</span>
            <span className={`text-xs font-mono ${pushPermission === 'granted' ? 'text-[#00D084]' : pushPermission === 'denied' ? 'text-[#FF3B3B]' : 'text-[#FFB800]'}`}>
              {pushPermission}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8080A0]">VAPID configurado</span>
            <span className={`text-xs font-mono ${vapidKey ? 'text-[#00D084]' : 'text-[#FF3B3B]'}`}>
              {vapidKey ? 'Sí ✓' : 'No — configurar VAPID_PUBLIC_KEY'}
            </span>
          </div>
          {pushSupported && pushPermission !== 'granted' && vapidKey && (
            <button
              onClick={enablePush}
              disabled={requestingPush}
              className="w-full py-2.5 rounded-xl bg-[#FFB800] hover:bg-[#E6A600] disabled:opacity-50 text-black text-sm font-bold transition-all"
            >
              {requestingPush ? 'Configurando...' : 'Activar notificaciones push'}
            </button>
          )}
          {pushPermission === 'granted' && (
            <div className="text-xs text-[#00D084] text-center">✓ Notificaciones push activadas</div>
          )}
          {!pushSupported && (
            <p className="text-xs text-[#4A4A60]">
              Para push notifications en iOS: instala la app desde Safari → Compartir → Añadir a pantalla de inicio.
              Requiere iOS 16.4+.
            </p>
          )}
        </div>
      ),
    },
    {
      icon: Key,
      color: '#00D084',
      title: 'Variables de entorno',
      items: [
        { label: 'ANTHROPIC_API_KEY', value: sheriffStatus?.claude_available ? '••••••••' : 'No configurada' },
        { label: 'OPENAI_API_KEY', value: sheriffStatus?.openai_available ? '••••••••' : 'No configurada' },
        { label: 'VAPID_PUBLIC_KEY', value: vapidKey ? '••••••••' : 'No configurada' },
        { label: 'MOCK_SENSORS', value: health?.mock_sensors ? 'true' : 'false' },
      ],
    },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Ajustes</h1>
        <p className="text-xs text-[#8080A0] mt-0.5">Configuración del sistema Sheriff Home</p>
      </div>

      {sections.map((section, idx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <section.icon size={16} style={{ color: section.color }} />
            <span className="text-sm font-semibold text-white">{section.title}</span>
          </div>

          {section.custom ?? (
            <div className="space-y-2.5">
              {section.items?.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#8080A0]">{item.label}</span>
                  <span className="text-xs font-mono text-white text-right max-w-[55%] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* About */}
      <div className="bg-[#12121A] border border-[#1A1A24] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-[#4A4A60]" />
          <span className="text-sm font-semibold text-white">Acerca de</span>
        </div>
        <div className="space-y-1.5 text-xs text-[#4A4A60]">
          <div>Sheriff Home v0.2.0 — Sistema de seguridad hogareña con IA</div>
          <div>Alonso Javier · Lima, Perú · 2026</div>
          <a
            href="https://github.com/alonsix33/VerisureSix6"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#3B82F6] hover:text-[#60A5FA] transition-colors mt-2"
          >
            GitHub <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  )
}
