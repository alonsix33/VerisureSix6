import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { Schedule, SheriffMode } from '../types'
import { Plus, Trash2, CalendarDays, Plane, X } from 'lucide-react'
import { API } from '../store'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MODES: SheriffMode[] = ['casa', 'fuera', 'noche', 'viaje', 'off']
const MODE_COLOR: Record<string, string> = {
  casa: '#00D084', fuera: '#FFB800', noche: '#A78BFA', viaje: '#FF3B3B', off: '#4A4A60',
}

export default function SchedulesPage() {
  const schedules    = useStore((s) => s.schedules)
  const travelPeriods = useStore((s) => s.travelPeriods)
  const fetchSchedules = useStore((s) => s.fetchSchedules)
  const fetchTravel  = useStore((s) => s.fetchTravelPeriods)

  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showTravelForm, setShowTravelForm] = useState(false)

  useEffect(() => {
    fetchSchedules()
    fetchTravel()
  }, [fetchSchedules, fetchTravel])

  async function deleteSchedule(id: string) {
    await fetch(`${API}/api/v1/schedules/${id}`, { method: 'DELETE' })
    fetchSchedules()
  }

  async function toggleSchedule(schedule: Schedule) {
    await fetch(`${API}/api/v1/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !schedule.is_active }),
    })
    fetchSchedules()
  }

  async function deleteTravel(id: string) {
    await fetch(`${API}/api/v1/travel/${id}`, { method: 'DELETE' })
    fetchTravel()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Horarios & Automatización</h1>
        <p className="text-xs text-[#8080A0] mt-0.5">Programar cambios de modo automáticos</p>
      </div>

      {/* ── Schedules ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#3B82F6]" />
            <span className="text-sm font-semibold text-white">Horarios semanales</span>
          </div>
          <button
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2040] border border-[#3B82F6]/30 text-xs text-[#3B82F6] hover:bg-[#1E2650] transition-all"
          >
            <Plus size={12} /> Nuevo
          </button>
        </div>

        <div className="space-y-2">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-[#4A4A60] text-sm bg-[#12121A] border border-[#1A1A24] rounded-2xl">
              Sin horarios configurados
            </div>
          ) : (
            schedules.map((s) => (
              <motion.div
                key={s.id}
                layout
                className="bg-[#12121A] border border-[#1A1A24] rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: MODE_COLOR[s.mode] ?? '#4A4A60' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{s.name}</span>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ background: `${MODE_COLOR[s.mode]}20`, color: MODE_COLOR[s.mode] }}
                    >
                      {s.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#8080A0] font-mono">{s.start_time} – {s.end_time}</span>
                    <div className="flex gap-0.5">
                      {DAYS.map((day, i) => (
                        <span
                          key={day}
                          className="text-[10px] px-1 rounded"
                          style={{
                            background: s.days_of_week.includes(i) ? `${MODE_COLOR[s.mode]}20` : 'transparent',
                            color: s.days_of_week.includes(i) ? MODE_COLOR[s.mode] : '#3A3A50',
                          }}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSchedule(s)}
                    className={`w-10 h-6 rounded-full transition-all relative ${s.is_active ? 'bg-[#00D084]' : 'bg-[#23232F]'}`}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                      style={{ left: s.is_active ? '22px' : '2px' }}
                    />
                  </button>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="text-[#4A4A60] hover:text-[#FF3B3B] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ── Travel periods ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane size={16} className="text-[#FFB800]" />
            <span className="text-sm font-semibold text-white">Periodos de viaje</span>
          </div>
          <button
            onClick={() => setShowTravelForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1100] border border-[#FFB800]/30 text-xs text-[#FFB800] hover:bg-[#201500] transition-all"
          >
            <Plus size={12} /> Nuevo viaje
          </button>
        </div>

        <div className="space-y-2">
          {travelPeriods.length === 0 ? (
            <div className="text-center py-8 text-[#4A4A60] text-sm bg-[#12121A] border border-[#1A1A24] rounded-2xl">
              Sin viajes programados
            </div>
          ) : (
            travelPeriods.map((t) => {
              const start = new Date(t.start_date + 'T00:00:00')
              const end   = new Date(t.end_date + 'T00:00:00')
              const now   = new Date()
              const active = now >= start && now <= end
              return (
                <motion.div
                  key={t.id}
                  layout
                  className="bg-[#12121A] border border-[#1A1A24] rounded-xl p-4 flex items-center gap-3"
                >
                  <Plane size={18} className={active ? 'text-[#FFB800]' : 'text-[#4A4A60]'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{t.name}</span>
                      {active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFB800]20 text-[#FFB800] animate-pulse">
                          EN CURSO
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#8080A0] font-mono mt-1">
                      {start.toLocaleDateString('es-PE')} → {end.toLocaleDateString('es-PE')}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTravel(t.id)}
                    className="text-[#4A4A60] hover:text-[#FF3B3B] transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Schedule form modal */}
      <AnimatePresence>
        {showScheduleForm && (
          <ScheduleForm
            onClose={() => setShowScheduleForm(false)}
            onSave={() => { setShowScheduleForm(false); fetchSchedules() }}
          />
        )}
        {showTravelForm && (
          <TravelForm
            onClose={() => setShowTravelForm(false)}
            onSave={() => { setShowTravelForm(false); fetchTravel() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ScheduleForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<SheriffMode>('fuera')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [saving, setSaving] = useState(false)

  function toggleDay(d: number) {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`${API}/api/v1/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mode, days_of_week: days, start_time: startTime, end_time: endTime }),
    })
    setSaving(false)
    onSave()
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121A] border-t border-[#23232F] rounded-t-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Nuevo horario</span>
          <button onClick={onClose}><X size={18} className="text-[#4A4A60]" /></button>
        </div>
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del horario"
          className="w-full bg-[#0E0E16] border border-[#23232F] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#4A4A60] focus:outline-none focus:border-[#3B82F6]/50"
        />
        <div>
          <div className="text-xs text-[#8080A0] mb-2">Modo</div>
          <div className="flex gap-2 flex-wrap">
            {MODES.map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase"
                style={{ background: mode === m ? `${MODE_COLOR[m]}25` : 'transparent', color: mode === m ? MODE_COLOR[m] : '#4A4A60', border: `1px solid ${mode === m ? MODE_COLOR[m] + '40' : '#23232F'}` }}
              >{m}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#8080A0] mb-2">Días</div>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)}
                className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                style={{ background: days.includes(i) ? `${MODE_COLOR[mode]}20` : '#0E0E16', color: days.includes(i) ? MODE_COLOR[mode] : '#4A4A60', border: `1px solid ${days.includes(i) ? MODE_COLOR[mode] + '40' : '#23232F'}` }}
              >{d}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="text-xs text-[#8080A0] mb-1">Inicio</div>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-[#0E0E16] border border-[#23232F] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-[#8080A0] mb-1">Fin</div>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-[#0E0E16] border border-[#23232F] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none" />
          </div>
        </div>
        <button onClick={save} disabled={!name.trim() || saving}
          className="w-full py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-bold transition-all">
          {saving ? 'Guardando...' : 'Guardar horario'}
        </button>
      </motion.div>
    </>
  )
}

function TravelForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim() || !startDate || !endDate) return
    setSaving(true)
    await fetch(`${API}/api/v1/travel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, start_date: startDate, end_date: endDate }),
    })
    setSaving(false)
    onSave()
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121A] border-t border-[#23232F] rounded-t-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Nuevo viaje</span>
          <button onClick={onClose}><X size={18} className="text-[#4A4A60]" /></button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Japón 2026)"
          className="w-full bg-[#0E0E16] border border-[#23232F] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#4A4A60] focus:outline-none focus:border-[#FFB800]/50" />
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="text-xs text-[#8080A0] mb-1">Salida</div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#0E0E16] border border-[#23232F] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-[#8080A0] mb-1">Regreso</div>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#0E0E16] border border-[#23232F] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none" />
          </div>
        </div>
        <button onClick={save} disabled={!name.trim() || !startDate || !endDate || saving}
          className="w-full py-3 rounded-xl bg-[#FFB800] hover:bg-[#E6A600] disabled:opacity-50 text-black text-sm font-bold transition-all">
          {saving ? 'Guardando...' : 'Guardar viaje'}
        </button>
      </motion.div>
    </>
  )
}
