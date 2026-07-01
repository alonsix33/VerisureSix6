import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { Toaster } from 'sonner'
import {
  House, WaveTriangle, ShieldCheck, SquaresFour, SlidersHorizontal,
  Chat, Eye, GearSix, CalendarBlank, X, Warning,
} from '@phosphor-icons/react'

const BOTTOM_NAV = [
  { to: '/',         label: 'Inicio',  Icon: House           },
  { to: '/timeline', label: 'Hoy',     Icon: WaveTriangle    },
  { to: '/chat',     label: 'Sheriff', Icon: ShieldCheck     },
  { to: '/cameras',  label: 'Hogar',   Icon: SquaresFour     },
  { to: '/settings', label: 'Ajustes', Icon: SlidersHorizontal },
]

const SIDEBAR_NAV = [
  { to: '/',          label: 'Dashboard',  Icon: SquaresFour   },
  { to: '/timeline',  label: 'Eventos',    Icon: WaveTriangle  },
  { to: '/cameras',   label: 'Zonas',      Icon: Eye           },
  { to: '/chat',      label: 'Sheriff IA', Icon: Chat          },
  { to: '/schedules', label: 'Rutinas',    Icon: CalendarBlank },
  { to: '/settings',  label: 'Ajustes',   Icon: GearSix       },
]

const MODE_LABELS: Record<string, string> = {
  off: 'Apagado', monitor: 'Monitor', casa: 'Casa',
  fuera: 'Fuera', noche: 'Noche', viaje: 'Viaje',
}

function fmtClock() {
  return new Date().toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' })
}

export default function Layout() {
  const config      = useStore((s) => s.config)
  const health      = useStore((s) => s.health)
  const wsConnected = useStore((s) => s.wsConnected)
  const error       = useStore((s) => s.clearError)
  const errorMsg    = useStore((s) => s.error)
  const location    = useLocation()

  const [clock, setClock] = useState(fmtClock)
  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock()), 30000)
    return () => clearInterval(id)
  }, [])

  const mode = config?.mode || 'off'

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--surface-viewport)' }}>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
          },
        }}
      />

      {/* ── SIDEBAR (desktop ≥768px) ── */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 240, flexShrink: 0,
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-default)',
          position: 'sticky', top: 0, height: '100dvh',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '22px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-subtle)',
            border: '1.5px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Chat size={18} weight="fill" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              Sheriff
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
              Home Security
            </div>
          </div>
        </div>

        {/* Mode chip */}
        <div style={{
          margin: '14px 16px 8px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
          }} className="anim-breathe" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', flex: 1 }}>
            {MODE_LABELS[mode] ?? mode}
          </span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: wsConnected ? 'var(--status-safe)' : 'var(--status-alert)',
            flexShrink: 0,
          }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {SIDEBAR_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'all var(--transition-base)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                color: isActive ? 'var(--accent-dark)' : 'var(--text-tertiary)',
                border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <item.Icon size={17} weight={isActive ? 'fill' : 'regular'} style={{ flexShrink: 0 }} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)' }}>
            v{health?.version ?? '0.2.0'}
          </span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 8px', borderRadius: 8,
            background: health?.mock_sensors ? 'var(--accent-subtle)' : 'rgba(126,148,102,0.14)',
            color: health?.mock_sensors ? 'var(--accent-text)' : 'var(--status-safe-dark)',
            border: `1px solid ${health?.mock_sensors ? 'var(--accent-border)' : 'rgba(126,148,102,0.3)'}`,
          }}>
            {health?.mock_sensors ? 'MOCK' : 'LIVE'}
          </span>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile status bar overlay */}
        <div
          className="md:hidden"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            height: 46, zIndex: 35, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          {/* Left: clock + ws dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {clock}
            </span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: wsConnected ? 'var(--status-safe)' : 'var(--status-alert)',
              display: 'block',
              animation: wsConnected ? 'scBreathe 2.6s ease-in-out infinite' : 'none',
            }} />
          </div>
          {/* Right: mock pill */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 9px', borderRadius: 9999,
            background: health?.mock_sensors ? 'var(--accent-subtle)' : 'rgba(126,148,102,0.14)',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
            color: health?.mock_sensors ? 'var(--accent-dark)' : 'var(--status-safe-dark)',
          }}>
            {health?.mock_sensors ? 'MOCK' : 'LIVE'}
          </span>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div style={{
            margin: '12px 20px 0', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
          }}>
            <Warning size={14} style={{ color: 'var(--accent-dark)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{errorMsg}</span>
            <button onClick={error} style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Page content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 0 120px',
          }}
        >
          <Outlet />
        </div>

        {/* ── BOTTOM NAV (mobile) ── */}
        <nav
          className="md:hidden"
          style={{
            position: 'fixed',
            left: 14, right: 14, bottom: 14,
            zIndex: 30,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 26,
            boxShadow: 'var(--shadow-nav)',
            padding: 8,
            display: 'flex', gap: 4,
          }}
        >
          {BOTTOM_NAV.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 3, padding: '9px 0',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  borderRadius: 17,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  textDecoration: 'none',
                  transition: 'background var(--transition-base)',
                }}
              >
                <item.Icon size={21} weight={isActive ? 'fill' : 'regular'} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </main>
    </div>
  )
}
