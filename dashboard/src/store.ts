import { create } from 'zustand'
import type {
  EventData, SheriffConfig, Device, HealthStatus,
  Schedule, TravelPeriod, StatsSummary, SheriffStatus,
} from './types'

export const API = import.meta.env.VITE_API_URL || ''

interface AppState {
  events: EventData[]
  devices: Device[]
  config: SheriffConfig | null
  health: HealthStatus | null
  schedules: Schedule[]
  travelPeriods: TravelPeriod[]
  stats: StatsSummary | null
  sheriffStatus: SheriffStatus | null
  wsConnected: boolean
  sidebarOpen: boolean
  loading: boolean
  error: string | null
  snapshotUrl: string | null

  setEvents: (events: EventData[]) => void
  addEvent: (event: EventData) => void
  setDevices: (devices: Device[]) => void
  setConfig: (config: SheriffConfig) => void
  setHealth: (health: HealthStatus) => void
  setSchedules: (schedules: Schedule[]) => void
  setTravelPeriods: (periods: TravelPeriod[]) => void
  setStats: (stats: StatsSummary) => void
  setSheriffStatus: (status: SheriffStatus) => void
  setWsConnected: (v: boolean) => void
  setSidebarOpen: (v: boolean) => void
  setSnapshotUrl: (v: string | null) => void
  clearError: () => void

  fetchInitial: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchSchedules: () => Promise<void>
  fetchTravelPeriods: () => Promise<void>
  updateSheriffMode: (mode: string) => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  events: [],
  devices: [],
  config: null,
  health: null,
  schedules: [],
  travelPeriods: [],
  stats: null,
  sheriffStatus: null,
  wsConnected: false,
  sidebarOpen: false,
  loading: true,
  error: null,
  snapshotUrl: null,

  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({
    events: [event as EventData, ...s.events].slice(0, 500),
    error: null,
  })),
  setDevices: (devices) => set({ devices }),
  setConfig: (config) => {
    set({ config })
  },
  setHealth: (health) => set({ health }),
  setSchedules: (schedules) => set({ schedules }),
  setTravelPeriods: (periods) => set({ travelPeriods: periods }),
  setStats: (stats) => set({ stats }),
  setSheriffStatus: (status) => set({ sheriffStatus: status }),
  setWsConnected: (v) => set({ wsConnected: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setSnapshotUrl: (v) => set({ snapshotUrl: v }),
  clearError: () => set({ error: null }),

  fetchInitial: async () => {
    set({ loading: true, error: null })
    try {
      const [eventsRes, devicesRes, configRes, healthRes, statusRes] = await Promise.all([
        fetch(`${API}/api/v1/events?limit=50`),
        fetch(`${API}/api/v1/devices`),
        fetch(`${API}/api/v1/sheriff/config`),
        fetch(`${API}/health`),
        fetch(`${API}/api/v1/sheriff/status`),
      ])
      if (eventsRes.ok) set({ events: await eventsRes.json() })
      if (devicesRes.ok) set({ devices: await devicesRes.json() })
      if (configRes.ok) set({ config: await configRes.json() })
      if (healthRes.ok) set({ health: await healthRes.json() })
      if (statusRes.ok) set({ sheriffStatus: await statusRes.json() })
      if (!eventsRes.ok || !healthRes.ok) {
        set({ error: 'Error al conectar con el servidor' })
      }
    } catch (e) {
      set({ error: `No se puede conectar al backend: ${(e as Error).message}` })
    } finally {
      set({ loading: false })
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch(`${API}/api/v1/stats/summary`)
      if (res.ok) set({ stats: await res.json() })
    } catch { /* silent */ }
  },

  fetchSchedules: async () => {
    try {
      const res = await fetch(`${API}/api/v1/schedules`)
      if (res.ok) set({ schedules: await res.json() })
    } catch { /* silent */ }
  },

  fetchTravelPeriods: async () => {
    try {
      const res = await fetch(`${API}/api/v1/travel`)
      if (res.ok) set({ travelPeriods: await res.json() })
    } catch { /* silent */ }
  },

  updateSheriffMode: async (mode: string) => {
    try {
      const res = await fetch(`${API}/api/v1/sheriff/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (res.ok) {
        const config = await res.json()
        set({ config })
      }
    } catch { /* silent */ }
  },
}))
