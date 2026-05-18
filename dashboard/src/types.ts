export interface EventData {
  id: string
  device_id: string
  device_name: string | null
  zone: string | null
  event_type: string
  alert_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  snapshot_path: string | null
  sheriff_evaluated: boolean
  sheriff_decision: SheriffDecision | null
  notified: boolean
  timestamp: string
  created_at: string
}

export interface SheriffDecision {
  is_anomalous: boolean
  alert_level: string
  reasoning: string
  message: string | null
  recommended_action: string | null
}

export interface SheriffConfig {
  id: string
  mode: 'off' | 'monitor' | 'normal' | 'away' | 'travel'
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
  services: {
    rf: { running: boolean; status: string }
    tapo: { running: boolean; hub: string }
  }
}
