import { Outlet, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import {
  House,
  Radio,
  Camera,
  Settings,
  MessageSquare,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/timeline', label: 'Eventos', icon: Radio },
  { to: '/cameras', label: 'Cámaras', icon: Camera },
  { to: '/config', label: 'Sheriff', icon: Settings },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
]

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const health = useStore((s) => s.health)
  const wsConnected = useStore((s) => s.wsConnected)
  const error = useStore((s) => s.error)
  const clearError = useStore((s) => s.clearError)

  return (
    <div className="flex h-full">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation drawer — M3 style */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-72
          bg-[var(--md-surface-container-lowest)]
          border-r border-[var(--md-outline-variant)]
          transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
        `}
      >
        {/* Drawer header */}
        <div className="px-6 py-5 border-b border-[var(--md-outline-variant)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[var(--md-title-lg)] font-bold text-[var(--md-on-surface)] tracking-tight">
                Sheriff
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wsConnected ? 'bg-green-500' : 'bg-red-500'
                  } ${wsConnected ? 'animate-pulse' : ''}`}
                />
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  {wsConnected ? 'En vivo' : 'Desconectado'}
                </span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-md'
                    : 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)] hover:text-[var(--md-on-surface)]'
                }`
              }
            >
              <item.icon size={20} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-[var(--md-outline-variant)]">
          <div className="flex items-center gap-2 text-xs text-[var(--md-on-surface-variant)]">
            {health && <span>v{health.version}</span>}
            <span className="ml-auto">Alonso</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top app bar — mobile only */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-colors"
          >
            <Menu size={22} />
          </button>
          <h1 className="font-bold text-[var(--md-title-md)] text-[var(--md-on-surface)]">
            Sheriff
          </h1>
          <span
            className={`w-2 h-2 rounded-full ml-auto ${
              wsConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-4 md:mx-6 md:mt-6 animate-fade-in">
            <div className="flex items-center gap-3 bg-[var(--md-error-container)] border border-[var(--md-error)]/30 rounded-[var(--md-shape-md)] px-4 py-3">
              <AlertTriangle size={16} className="text-[var(--md-error)] shrink-0" />
              <span className="flex-1 text-sm text-[var(--md-on-error-container)]">
                {error}
              </span>
              <button
                onClick={clearError}
                className="text-[var(--md-on-error-container)] hover:text-[var(--md-error)] shrink-0 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
