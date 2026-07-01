import { useRegisterSW } from 'virtual:pwa-register/react'
import { ArrowClockwise } from '@phosphor-icons/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      // Check on each visibility restore (app comes back to foreground)
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') registration.update()
      }
      document.addEventListener('visibilitychange', handleVisibility)

      // Check every 30 minutes while app stays open
      setInterval(() => registration.update(), 30 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 18, right: 18, bottom: 100,
        zIndex: 60,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        borderRadius: 20,
        background: '#2C2723',
        boxShadow: '0 8px 28px rgba(44,39,35,0.38)',
        border: '1px solid rgba(242,234,221,0.10)',
        animation: 'slideUp 280ms cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F2EADD' }}>
          Nueva versión disponible
        </div>
        <div style={{ fontSize: 11, color: 'rgba(242,234,221,0.55)', marginTop: 2 }}>
          Sheriff Home se ha actualizado
        </div>
      </div>

      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          padding: '7px 10px', borderRadius: 10,
          background: 'rgba(242,234,221,0.10)',
          border: 'none', color: 'rgba(242,234,221,0.45)',
          fontSize: 12, cursor: 'pointer',
        }}
      >
        Luego
      </button>

      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10,
          background: '#DFA251',
          border: 'none', color: '#2C2723',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(223,162,81,0.35)',
        }}
      >
        <ArrowClockwise size={14} weight="bold" />
        Actualizar
      </button>
    </div>
  )
}
