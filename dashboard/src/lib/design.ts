import type { AlertLevel } from '../types'

/* ── Mode config ── */
export const MODE_COLOR: Record<string, string> = {
  off:     'var(--mode-off)',
  monitor: 'var(--mode-monitor)',
  casa:    'var(--mode-casa)',
  fuera:   'var(--mode-fuera)',
  noche:   'var(--mode-noche)',
  viaje:   'var(--mode-viaje)',
}

export const MODE_COLOR_RAW: Record<string, string> = {
  off:     '#A89B8C',
  monitor: '#6E94A8',
  casa:    '#7E9466',
  fuera:   '#DFA251',
  noche:   '#8E7BA0',
  viaje:   '#C26248',
}

export const MODE_META: Record<string, { label: string; desc: string }> = {
  off:     { label: 'Apagado',  desc: 'En reposo' },
  monitor: { label: 'Monitor',  desc: 'Observando con calma' },
  casa:    { label: 'Casa',     desc: 'Estás en casa' },
  fuera:   { label: 'Fuera',    desc: 'Cuidando tu hogar' },
  noche:   { label: 'Noche',    desc: 'Velando tu descanso' },
  viaje:   { label: 'Viaje',    desc: 'Atento a todo' },
}

/* ── Alert level → design level ── */
export interface DesignLevel {
  color: string
  bg: string
  text: string
  label: string
}

export function alertToLevel(level: AlertLevel): DesignLevel {
  const map: Record<string, DesignLevel> = {
    critical: { color: 'var(--level-importante)',     bg: 'var(--level-importante-bg)',    text: 'var(--level-importante-text)',    label: 'Importante' },
    high:     { color: 'var(--level-importante)',     bg: 'var(--level-importante-bg)',    text: 'var(--level-importante-text)',    label: 'Importante' },
    medium:   { color: 'var(--level-atencion)',       bg: 'var(--level-atencion-bg)',      text: 'var(--level-atencion-text)',      label: 'Atención' },
    low:      { color: 'var(--level-rutina)',         bg: 'var(--level-rutina-bg)',        text: 'var(--level-rutina-text)',        label: 'Rutina' },
    none:     { color: 'var(--level-info)',           bg: 'var(--level-info-bg)',          text: 'var(--level-info-text)',          label: 'Info' },
  }
  return map[level] ?? map.none
}

/* ── Relative time ── */
export function relTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

/* ── Format time HH:MM ── */
export function fmtTime(timestamp: string): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ── SVG area chart from hourly data ── */
export function buildChart(
  byHour: Array<{ hour: number; count: number }>,
  width = 322,
  height = 58,
): { line: string; area: string } {
  const data = Array.from({ length: 24 }, (_, i) => {
    const found = byHour.find((h) => h.hour === i)
    return found?.count ?? 0
  })
  const max = Math.max(...data, 1)
  const top = 4, btm = height - 4
  const pts = data.map((v, i) => [
    (i / 23) * width,
    btm - ((v / max) * (btm - top)),
  ])
  let line = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i]
    const cx = ((p0[0] + p1[0]) / 2).toFixed(1)
    line += ` C${cx} ${p0[1].toFixed(1)} ${cx} ${p1[1].toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`
  }
  return { line, area: `${line} L${width} ${btm} L0 ${btm} Z` }
}

/* ── Hex to rgba helper ── */
export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* ── Event type → Spanish friendly name ── */
export function eventTypeName(raw: string): string {
  const MAP: Record<string, string> = {
    motion_detected:      'Movimiento',
    motion_start:         'Movimiento',
    motion_end:           'Movimiento',
    zone_crossed:         'Zona cruzada',
    presence_detected:    'Presencia',
    no_presence:          'Sin presencia',
    door_opened:          'Puerta abierta',
    door_closed:          'Puerta cerrada',
    window_opened:        'Ventana abierta',
    window_closed:        'Ventana cerrada',
    camera_connected:     'Cámara conectada',
    camera_disconnected:  'Cámara desconectada',
    camera_motion:        'Movimiento en cámara',
    alarm_triggered:      'Alarma activada',
    alarm_disarmed:       'Alarma desactivada',
    battery_low:          'Batería baja',
    signal_lost:          'Sin señal',
    signal_restored:      'Señal restaurada',
    tamper:               'Manipulación',
    smoke_detected:       'Humo detectado',
    hub_online:           'Hub conectado',
    hub_offline:          'Hub desconectado',
    rf_signal:            'Señal RF',
  }
  return MAP[raw] ?? raw.replace(/_/g, ' ')
}
