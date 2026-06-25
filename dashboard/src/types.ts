export type AlertLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'
export type FilterLevel = AlertLevel | 'all'
export type SheriffMode = 'off' | 'casa' | 'fuera' | 'noche' | 'viaje'

export interface SheriffDecision {
  is_anomalous: boolean
  alert_level: AlertLevel
  reasoning: string
  message: string | null
  recommended_action: string | null
}

export interface EventData {
  id: string
  device_id: string
  device_name: string | null
  zone: string | null
  event_type: string
  alert_level: AlertLevel
  snapshot_path: string | null
  sheriff_evaluated: boolean
  sheriff_decision: SheriffDecision | null
  notified: boolean
  timestamp: string
  created_at: string
}

export interface SheriffConfig {
  id: string
  mode: SheriffMode
  vision_threshold: number
  alert_zones: string[]
  ignored_zones: string[]
  schedule: Record<string, unknown> | null
  travel_periods: unknown[] | null
  cooldown_minutes: number
  escalation_enabled: boolean
  updated_at: string
  created_at: string
}

export interface Device {
  id: string
  device_id: string
  name: string
  device_type: string
  zone: string | null
  protocol: string
  battery_level: number | null
  signal_strength: number | null
  enabled: boolean
  last_seen: string | null
  created_at: string
}

export interface HealthStatus {
  status: string
  version: string
  sheriff_mode: string
  mock_sensors: boolean
  services: {
    rf: { running: boolean; status: string }
    tapo: { running: boolean; hub: string }
  }
}

export interface Schedule {
  id: string
  name: string
  mode: SheriffMode
  days_of_week: number[]
  start_time: string
  end_time: string
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface TravelPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'sheriff'
  content: string
  model_used: string | null
  timestamp: string
}

export interface StatsSummary {
  today: { total_events: number; alerts: number; unread_alerts: number }
  week: { total_events: number }
  by_zone: Array<{ zone: string; count: number }>
  by_hour: Array<{ hour: number; count: number }>
  critical_events: Array<{
    id: string
    zone: string | null
    event_type: string
    alert_level: AlertLevel
    timestamp: string
  }>
  generated_at: string
}

export interface WeeklyStats {
  days: Array<{ date: string; total: number; alerts: number }>
  generated_at: string
}

export interface SheriffStatus {
  mode: SheriffMode
  mock_sensors: boolean
  claude_available: boolean
  openai_available: boolean
  push_configured: boolean
}
