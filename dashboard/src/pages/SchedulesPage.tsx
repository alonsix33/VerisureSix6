import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Plus, ArrowLeft, Airplane } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import { MODE_COLOR_RAW } from '../lib/design'
import type { Schedule } from '../types'

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MODE_LABELS: Record<string, string> = {
  off: 'Apagado', monitor: 'Monitor', casa: 'Casa',
  fuera: 'Fuera', noche: 'Noche', viaje: 'Viaje',
}

const TRAVEL_CARDS = [
  { id: 'weekend', label: 'Fin de semana', from: 'vie 20:00', to: 'dom 22:00' },
  { id: 'vacation', label: 'Vacaciones', from: 'Variable', to: 'Variable' },
]

export default function SchedulesPage() {
  const schedules       = useStore((s) => s.schedules)
  const loading         = useStore((s) => s.loading)
  const fetchSchedules  = useStore((s) => s.fetchSchedules)
  const navigate        = useNavigate()

  const [createOpen, setCreateOpen]           = useState(false)
  const [createTravelOpen, setCreateTravelOpen] = useState(false)
  const [form, setForm] = useState({ name: '', mode: 'fuera', time: '08:00', days: [0, 1, 2, 3, 4] as number[] })

  useEffect(() => {
    fetchSchedules?.()
  }, [fetchSchedules])

  function toggleDay(idx: number) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(idx) ? prev.days.filter((d) => d !== idx) : [...prev.days, idx].sort(),
    }))
  }

  return (
    <div style={{ paddingBottom: 104 }}>

      {/* Header */}
      <div style={{ padding: '54px 18px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 12, background: '#FFFCF6', border: '1px solid rgba(80,60,40,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A7065', flexShrink: 0 }}
        >
          <ArrowLeft size={17} />
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: '#2C2723' }}>
          Rutinas
        </div>
      </div>

      {/* Cuando viajas */}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#7A7065', marginBottom: 12 }}>Cuando viajas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TRAVEL_CARDS.map((card) => (
            <div
              key={card.id}
              style={{
                position: 'relative', padding: 16, borderRadius: 20, overflow: 'hidden',
                background: 'linear-gradient(135deg, #C26248, #D98A3D)',
                boxShadow: '0 12px 28px rgba(180,80,50,0.22)',
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Airplane size={20} weight="duotone" style={{ color: '#FFF8EF' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF8EF' }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,248,239,0.8)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {card.from} — {card.to}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tu semana */}
      <div style={{ padding: '24px 18px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#7A7065', marginBottom: 12 }}>Tu semana</div>
        {loading ? (
          <LoadingSkeleton />
        ) : !schedules || schedules.length === 0 ? (
          <EmptySchedules />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedules.map((sch) => (
              <ScheduleCard key={sch.id} schedule={sch} />
            ))}
          </div>
        )}
      </div>

      {/* Create buttons */}
      <div style={{ padding: '20px 18px 0', display: 'flex', gap: 11 }}>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 14, borderRadius: 16,
            background: 'rgba(223,162,81,0.14)', border: '1px solid rgba(223,162,81,0.3)',
            color: '#B47B2A', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} weight="bold" /> Rutina
        </button>
        <button
          onClick={() => setCreateTravelOpen(true)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 14, borderRadius: 16,
            background: 'rgba(194,98,72,0.12)', border: '1px solid rgba(194,98,72,0.28)',
            color: '#B05A40', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} weight="bold" style={{ color: '#C26248' }} /> Viaje
        </button>
      </div>

      {/* Create rutina sheet */}
      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)}>
        <div style={{ padding: '10px 22px 34px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#2C2723', marginBottom: 18 }}>
            Nueva rutina
          </div>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Nombre</div>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej. Salida al trabajo"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--border-medium)', color: '#2C2723', fontSize: 14, fontFamily: 'var(--font-ui)', outline: 'none' }}
            />
          </label>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Modo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(MODE_LABELS).map(([m, label]) => {
                const active = form.mode === m
                const color = MODE_COLOR_RAW[m] ?? '#DFA251'
                return (
                  <button
                    key={m}
                    onClick={() => setForm((p) => ({ ...p, mode: m }))}
                    style={{
                      padding: '7px 14px', borderRadius: 9999,
                      fontSize: 13, fontWeight: active ? 700 : 400,
                      border: active ? `1.5px solid ${color}` : '1px solid rgba(80,60,40,0.15)',
                      background: active ? `${color}20` : 'var(--surface-card)',
                      color: active ? color : '#7A7065', cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Hora</div>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--border-medium)', color: '#2C2723', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none' }}
            />
          </label>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Días</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {DAYS.map((d, i) => {
                const active = form.days.includes(i)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(i)}
                    style={{
                      flex: 1, aspectRatio: '1', borderRadius: 10,
                      fontSize: 13, fontWeight: active ? 700 : 400,
                      background: active ? '#DFA251' : 'var(--surface-input)',
                      color: active ? '#2C2723' : '#ADA293',
                      border: active ? '1.5px solid #DFA251' : '1px solid rgba(80,60,40,0.15)',
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setCreateOpen(false)}
            style={{ width: '100%', padding: '14px 0', borderRadius: 'var(--radius-md)', background: '#DFA251', color: '#2C2723', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 14px rgba(223,162,81,0.30)', border: 'none', cursor: 'pointer' }}
          >
            Guardar rutina
          </button>
        </div>
      </BottomSheet>

      {/* Create travel sheet */}
      <BottomSheet open={createTravelOpen} onClose={() => setCreateTravelOpen(false)}>
        <div style={{ padding: '10px 22px 34px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#2C2723', marginBottom: 6 }}>
            Período de viaje
          </div>
          <div style={{ fontSize: 13, color: '#7A7065', marginBottom: 20 }}>
            Sheriff activará modo Viaje automáticamente en estas fechas.
          </div>
          <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Nombre</div>
            <input placeholder="Ej. Navidad en familia" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--border-medium)', color: '#2C2723', fontSize: 14, fontFamily: 'var(--font-ui)', outline: 'none' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <label>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Desde</div>
              <input type="date" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--border-medium)', color: '#2C2723', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }} />
            </label>
            <label>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#ADA293', marginBottom: 7, textTransform: 'uppercase' }}>Hasta</div>
              <input type="date" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-input)', border: '1px solid var(--border-medium)', color: '#2C2723', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }} />
            </label>
          </div>
          <button
            onClick={() => setCreateTravelOpen(false)}
            style={{ width: '100%', padding: '14px 0', borderRadius: 'var(--radius-md)', background: '#C26248', color: '#FFF8EF', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
          >
            Guardar período
          </button>
        </div>
      </BottomSheet>

    </div>
  )
}

function ScheduleCard({ schedule: s }: { schedule: Schedule }) {
  const color = MODE_COLOR_RAW[s.mode] ?? '#DFA251'
  const modeLabel = MODE_LABELS[s.mode] ?? s.mode
  return (
    <div style={{
      padding: 15, borderRadius: 18,
      background: '#FFFCF6', border: '1px solid rgba(80,60,40,0.08)',
      boxShadow: '0 6px 18px rgba(80,55,25,0.05)',
      opacity: s.is_active ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#2C2723' }}>
            {s.name || modeLabel}
          </span>
        </div>
        <div style={{
          width: 44, height: 26, borderRadius: 9999, position: 'relative', flexShrink: 0,
          background: s.is_active ? '#DFA251' : 'rgba(80,60,40,0.16)',
          transition: 'background 200ms ease',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: s.is_active ? 21 : 3,
            width: 20, height: 20, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 200ms ease',
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13 }}>
        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 9999, background: `${color}20`, fontSize: 11, fontWeight: 600, color }}>
          {modeLabel}
        </span>
        <span style={{ fontSize: 12, color: '#7A7065', fontVariantNumeric: 'tabular-nums' }}>
          {s.start_time}{s.end_time ? ` – ${s.end_time}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
        {DAYS.map((d, i) => {
          const active = s.days_of_week.includes(i)
          return (
            <span
              key={d}
              style={{
                width: 25, height: 25, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                background: active ? `${color}22` : 'var(--surface-input)',
                color: active ? color : '#ADA293',
              }}
            >
              {d}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function EmptySchedules() {
  return (
    <div style={{ textAlign: 'center', padding: '36px 32px', fontSize: 13, color: '#ADA293' }}>
      Crea una rutina para que Sheriff cambie de modo automáticamente.
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="anim-shimmer" style={{ height: 110, borderRadius: 18 }} />
      ))}
    </div>
  )
}
