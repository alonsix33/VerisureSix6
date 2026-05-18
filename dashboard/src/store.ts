import { create } from 'zustand'
import type { EventData, SheriffConfig, Device, HealthStatus } from './types'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface AppState {
  events: EventData[]
  devices: Device[]
  config: SheriffConfig | null
  health: HealthStatus | null
  wsConnected: boolean
  sidebarOpen: boolean

  setEvents: (events: EventData[]) => void
  addEvent: (event: EventData) => void
  setDevices: (devices: Device[]) => void
  setConfig: (config: SheriffConfig) => void
  setHealth: (health: HealthStatus) => void
  setWsConnected: (v: boolean) => void
  setSidebarOpen: (v: boolean) => void

  fetchInitial: () => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  events: [],
  devices: [],
  config: null,
  health: null,
  wsConnected: false,
  sidebarOpen: false,

  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 500) })),
  setDevices: (devices) => set({ devices }),
  setConfig: (config) => set({ config }),
  setHealth: (health) => set({ health }),
  setWsConnected: (v) => set({ wsConnected: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  fetchInitial: async () => {
    const [eventsRes, devicesRes, configRes, healthRes] = await Promise.all([
      fetch(`${API}/api/v1/events?limit=50`),
      fetch(`${API}/api/v1/devices`),
      fetch(`${API}/api/v1/sheriff/config`),
      fetch(`${API}/health`),
    ])
    if (eventsRes.ok) set({ events: await eventsRes.json() })
    if (devicesRes.ok) set({ devices: await devicesRes.json() })
    if (configRes.ok) set({ config: await configRes.json() })
    if (healthRes.ok) set({ health: await healthRes.json() })
  },
}))
