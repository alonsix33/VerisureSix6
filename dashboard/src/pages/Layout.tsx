import { Outlet, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import {
  LayoutDashboard, Radio, Camera, MessageSquare,
  CalendarDays, Settings, Menu, X, AlertTriangle, Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/timeline',  label: 'Eventos',    icon: Radio },
  { to: '/cameras',   label: 'Cámaras',    icon: Camera },
  { to: '/chat',      label: 'Sheriff IA', icon: MessageSquare },
  { to: '/schedules', label: 'Horarios',   icon: CalendarDays },
  { to: '/settings',  label: 'Ajustes',    icon: Settings },
]

const MODE_COLOR: Record<string, string> = {
  monitor: 'text-[#3B82F6]',
  casa:    'text-[#00D084]',
  fuera:   'text-[#FFB800]',
  noche:   'text-[#A78BFA]',
  viaje:   'text-[#FF3B3B]',
  off:     'text-[#4A4A60]',
}

export default function Layout() {
  const sidebarOpen   = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const health        = useStore((s) => s.health)
  const config        = useStore((s) => s.config)
  const wsConnected   = useStore((s) => s.wsConnected)
  const error         = useStore((s) => s.error)
  const clearError    = useStore((s) => s.clearError)

  const mode = config?.mode || 'off'
  const modeColor = MODE_COLOR[mode] ?? MODE_COLOR.off

  return (
    <div className="flex h-full relative">
      {/* Ambient glow that shifts by mode */}
      <div className="ambient-bg" data-mode={mode} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-64
          bg-[#07070D]/95 backdrop-blur-xl
          border-r border-[#1A1A24]
          transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1A1A24]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Shield size={22} className={modeColor} />
                {wsConnected && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00D084] ring-1 ring-[#07070D]" />
                )}
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">Sheriff</span>
                <span className="text-[10px] text-[#4A4A60] block -mt-0.5 font-mono">HOME SECURITY</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-[#4A4A60] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode indicator */}
        <div className="px-5 py-3 border-b border-[#1A1A24]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4A4A60] uppercase tracking-widest font-mono">Modo</span>
            <span className={`text-sm font-bold uppercase ${modeColor}`}>{mode}</span>
            <span className={`ml-auto w-2 h-2 rounded-full ${wsConnected ? 'bg-[#00D084] animate-pulse' : 'bg-[#FF3B3B]'}`} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1A1A2E] text-white border border-[#3B82F6]/30'
                    : 'text-[#8080A0] hover:bg-[#12121A] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1A1A24]">
          <div className="flex items-center gap-2 text-xs text-[#4A4A60] font-mono">
            <span>v{health?.version ?? '0.2.0'}</span>
            <span className="ml-auto">{health?.mock_sensors ? 'MOCK' : 'LIVE'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1A1A24] bg-[#07070D]/80 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#8080A0] hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <Shield size={18} className={modeColor} />
          <span className="font-bold text-white">Sheriff</span>
          <span className={`w-2 h-2 rounded-full ml-auto ${wsConnected ? 'bg-[#00D084]' : 'bg-[#FF3B3B]'}`} />
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-4 md:mx-6 md:mt-4 animate-fade-in">
            <div className="flex items-center gap-3 bg-[#1A0A0A] border border-[#FF3B3B]/30 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-[#FF3B3B] shrink-0" />
              <span className="flex-1 text-sm text-red-200">{error}</span>
              <button onClick={clearError} className="text-[#FF3B3B]/60 hover:text-[#FF3B3B] transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
