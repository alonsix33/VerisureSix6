import { Outlet, NavLink } from 'react-router-dom'
import { useStore } from '../store'

const navItems = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/timeline', label: 'Eventos', icon: '📡' },
  { to: '/config', label: 'Sheriff', icon: '⚙️' },
  { to: '/chat', label: 'Chat', icon: '💬' },
]

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const health = useStore((s) => s.health)
  const wsConnected = useStore((s) => s.wsConnected)

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-64
          bg-slate-900 border-r border-slate-800
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
        `}
      >
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white">Sheriff</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-slate-400">
              {wsConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {health && (
              <span className="text-xs text-slate-500 ml-auto">
                v{health.version}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          VerisureSix6 — Alonso
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-300 hover:text-white text-xl"
          >
            ☰
          </button>
          <h1 className="font-bold text-white">Sheriff</h1>
          <span
            className={`w-2 h-2 rounded-full ml-auto ${
              wsConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
