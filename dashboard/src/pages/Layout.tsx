import { Outlet, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import {
  LayoutDashboard, Radio, Camera, MessageSquare,
  CalendarDays, Settings, X, AlertTriangle, Shield,
} from 'lucide-react'

const DESKTOP_NAV = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/timeline',  label: 'Eventos',    icon: Radio },
  { to: '/cameras',   label: 'Zonas',      icon: Camera },
  { to: '/chat',      label: 'Sheriff IA', icon: MessageSquare },
  { to: '/schedules', label: 'Horarios',   icon: CalendarDays },
  { to: '/settings',  label: 'Ajustes',    icon: Settings },
]

const BOTTOM_NAV = [
  { to: '/',         label: 'Inicio',   icon: LayoutDashboard },
  { to: '/timeline', label: 'Eventos',  icon: Radio },
  { to: '/chat',     label: 'Sheriff',  icon: MessageSquare },
  { to: '/cameras',  label: 'Zonas',    icon: Camera },
  { to: '/settings', label: 'Ajustes',  icon: Settings },
]

export default function Layout() {
  const sidebarOpen    = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const health         = useStore((s) => s.health)
  const config         = useStore((s) => s.config)
  const wsConnected    = useStore((s) => s.wsConnected)
  const error          = useStore((s) => s.error)
  const clearError     = useStore((s) => s.clearError)

  const mode = config?.mode || 'off'

  return (
    <div className="flex h-full relative" style={{ background: 'var(--surface-base)' }}>

      {/* Desktop sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0,0,0,0.60)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop always, mobile drawer) ── */}
      <aside
        className={[
          'fixed md:static inset-y-0 left-0 z-30 flex flex-col',
          'transform transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{
          width: '240px',
          background: 'var(--surface-raised)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `var(--mode-${mode}-bg)`, border: `1px solid var(--mode-${mode}-border)` }}
              >
                <Shield size={18} style={{ color: `var(--mode-${mode})` }} />
              </div>
              {wsConnected && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{
                    background: 'var(--status-safe)',
                    boxShadow: '0 0 0 2px var(--surface-raised)',
                  }}
                />
              )}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Sheriff</div>
              <div className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--text-disabled)' }}>
                HOME SECURITY
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode chip */}
        <div
          className="mx-4 my-3 px-3 py-2 rounded-xl flex items-center gap-2 shrink-0"
          style={{ background: `var(--mode-${mode}-bg)`, border: `1px solid var(--mode-${mode}-border)` }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: `var(--mode-${mode})` }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: `var(--mode-${mode})` }}>
            {mode}
          </span>
          <span
            className={`ml-auto w-1.5 h-1.5 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
            style={{ background: wsConnected ? 'var(--status-safe)' : 'var(--status-alert)' }}
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'sidebar-item-active' : 'sidebar-item'
                }`
              }
              style={({ isActive }) => isActive
                ? {
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-text)',
                    border: '1px solid var(--accent-border)',
                  }
                : {
                    color: 'var(--text-tertiary)',
                    border: '1px solid transparent',
                  }
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center text-xs font-mono" style={{ color: 'var(--text-disabled)' }}>
            <span>v{health?.version ?? '0.2.0'}</span>
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: health?.mock_sensors ? 'var(--status-warn-bg)' : 'var(--status-safe-bg)',
                color: health?.mock_sensors ? 'var(--status-warn)' : 'var(--status-safe)',
              }}
            >
              {health?.mock_sensors ? 'MOCK' : 'LIVE'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 shrink-0"
          style={{
            background: 'var(--surface-raised)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `var(--mode-${mode}-bg)` }}
          >
            <Shield size={15} style={{ color: `var(--mode-${mode})` }} />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Sheriff Home</span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase"
              style={{ background: `var(--mode-${mode}-bg)`, color: `var(--mode-${mode})` }}
            >
              {mode}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
              style={{ background: wsConnected ? 'var(--status-safe)' : 'var(--status-alert)' }}
            />
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 shrink-0">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: 'var(--status-alert-bg)',
                border: '1px solid var(--status-alert-border)',
              }}
            >
              <AlertTriangle size={15} style={{ color: 'var(--status-alert)' }} className="shrink-0" />
              <span className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</span>
              <button
                onClick={clearError}
                className="transition-colors"
                style={{ color: 'var(--status-alert)' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe-nav md:pb-6">
          <Outlet />
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="bottom-nav md:hidden">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ background: 'var(--accent-default)' }}
                    />
                  )}
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}
