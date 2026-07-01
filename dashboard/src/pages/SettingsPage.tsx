import { useEffect, useState } from 'react'
import { useStore, API } from '../store'
import { Clock, MapTrifold, CaretRight } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const config       = useStore((s) => s.config)
  const health       = useStore((s) => s.health)
  const sheriffStatus = useStore((s) => s.sheriffStatus)
  const wsConnected  = useStore((s) => s.wsConnected)
  const fetchInitial = useStore((s) => s.fetchInitial)
  const setConfig    = useStore((s) => s.setConfig)
  const navigate     = useNavigate()

  const [escalation, setEscalation] = useState(true)

  useEffect(() => {
    if (!config) fetchInitial()
  }, [config, fetchInitial])

  useEffect(() => {
    if (config) setEscalation(config.escalation_enabled ?? true)
  }, [config])

  async function toggleEscalation() {
    const next = !escalation
    setEscalation(next)
    try {
      const res = await fetch(`${API}/api/v1/sheriff/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalation_enabled: next }),
      })
      if (res.ok) {
        const updated = await res.json()
        setConfig(updated)
      } else {
        setEscalation(!next)
      }
    } catch {
      setEscalation(!next)
    }
  }

  const isMock = health?.mock_sensors ?? true
  const version = health?.version ?? '—'

  return (
    <div style={{ padding: '54px 18px 16px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#2C2723', letterSpacing: '-0.4px', marginBottom: 18 }}>
        Ajustes
      </div>

      {/* GENERAL */}
      <Section label="GENERAL">
        <Card>
          <NavRow Icon={Clock} label="Rutinas y viajes" onClick={() => navigate('/schedules')} />
          <NavRow Icon={MapTrifold} label="Zonas y dispositivos" onClick={() => navigate('/cameras')} divider />
        </Card>
      </Section>

      {/* SHERIFF */}
      <Section label="SHERIFF">
        <Card>
          <Row label="Inteligencia">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: sheriffStatus?.claude_available ? '#7E9466' : '#ADA293',
              }} />
              <span style={{ fontSize: 13, color: sheriffStatus?.claude_available ? '#5E7349' : '#ADA293' }}>
                {sheriffStatus?.claude_available ? 'Claude · activo' : 'No disponible'}
              </span>
            </div>
          </Row>
          <Row label="Tono de avisos" divider>
            <span style={{ fontSize: 13, color: '#7A7065' }}>Tranquilo</span>
          </Row>
          <Row label="Espera entre avisos" divider>
            <span style={{ fontSize: 13, color: '#7A7065', fontVariantNumeric: 'tabular-nums' }}>
              {config ? `${(config.cooldown_minutes ?? 1.5) * 60} s` : '90 s'}
            </span>
          </Row>
          <Row label="Escalar lo importante" divider>
            <Toggle value={escalation} onChange={toggleEscalation} />
          </Row>
        </Card>
      </Section>

      {/* SISTEMA */}
      <Section label="SISTEMA">
        <Card>
          <Row label="Versión">
            <span style={{ fontSize: 13, color: '#7A7065', fontVariantNumeric: 'tabular-nums' }}>
              v{version}
            </span>
          </Row>
          <Row label="Modo de sensores" divider>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
              color: '#B47B2A', background: 'rgba(223,162,81,0.14)',
              padding: '3px 9px', borderRadius: 9999,
            }}>
              {isMock ? 'MOCK' : 'LIVE'}
            </span>
          </Row>
          <Row label="Servicios" divider>
            <span style={{ fontSize: 13, color: '#5E7349' }}>
              {health?.services ? `${Object.values(health.services).filter((s: any) => s.running).length} activos` : '— activos'}
            </span>
          </Row>
          <Row label="Conexión" divider>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: wsConnected ? '#7E9466' : '#ADA293',
              }} />
              <span style={{ fontSize: 13, color: wsConnected ? '#5E7349' : '#ADA293' }}>
                {wsConnected ? 'WebSocket' : 'Desconectado'}
              </span>
            </div>
          </Row>
        </Card>
      </Section>

      {/* CREDENCIALES */}
      <Section label="CREDENCIALES">
        <Card>
          <Row label="Anthropic API">
            <span style={{ fontSize: 13, color: '#ADA293' }}>sk-ant-••••4f2a</span>
          </Row>
          <Row label="Tapo Cloud" divider>
            <span style={{ fontSize: 13, color: '#5E7349' }}>•••• conectado</span>
          </Row>
          <Row label="Verisure" divider>
            <span style={{ fontSize: 13, color: '#5E7349' }}>•••• conectado</span>
          </Row>
        </Card>
      </Section>

      {/* NOTIFICACIONES */}
      <Section label="NOTIFICACIONES">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
            <span style={{ fontSize: 14, color: '#2C2723' }}>Avisos en el teléfono</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#ADA293' }}>No activo</span>
              <button style={{
                fontSize: 12, fontWeight: 600, color: '#B47B2A',
                background: 'rgba(223,162,81,0.14)', border: '1px solid rgba(223,162,81,0.28)',
                padding: '5px 12px', borderRadius: 9999, cursor: 'pointer',
              }}>
                Activar
              </button>
            </div>
          </div>
        </Card>
      </Section>

      {/* ACERCA DE */}
      <Section label="ACERCA DE">
        <Card>
          <Row label="Sheriff Home">
            <span style={{ fontSize: 13, color: '#7A7065' }}>PWA local</span>
          </Row>
          <Row label="Corre en" divider>
            <span style={{ fontSize: 13, color: '#7A7065' }}>Orange Pi 5</span>
          </Row>
          <Row label="Build" divider>
            <span style={{ fontSize: 11, color: '#ADA293', fontFamily: 'var(--font-mono)' }}>
              {new Date(__BUILD_TIME__).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </Row>
        </Card>
        <div style={{ textAlign: 'center', padding: '16px 0 4px', fontSize: 11, color: '#C2B6A4' }}>
          Hecho con calma · Lima, Perú
        </div>
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: '0 0 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#ADA293', padding: '0 4px 8px' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 18, background: '#FFFCF6',
      border: '1px solid rgba(80,60,40,0.08)',
      overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(80,55,25,0.04)',
    }}>
      {children}
    </div>
  )
}

function Row({ label, divider, children }: { label: string; divider?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 14,
      borderTop: divider ? '1px solid rgba(80,60,40,0.06)' : 'none',
    }}>
      <span style={{ fontSize: 14, color: '#2C2723' }}>{label}</span>
      {children}
    </div>
  )
}

function NavRow({ Icon, label, onClick, divider }: {
  Icon: React.ElementType; label: string; onClick: () => void; divider?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 13,
        width: '100%', textAlign: 'left', padding: 14,
        background: 'none', border: 'none', cursor: 'pointer',
        borderTop: divider ? '1px solid rgba(80,60,40,0.06)' : 'none',
      }}
    >
      <span style={{ display: 'flex', color: '#B47B2A' }}>
        <Icon size={17} />
      </span>
      <span style={{ flex: 1, fontSize: 14, color: '#2C2723' }}>{label}</span>
      <span style={{ display: 'flex', color: '#ADA293' }}>
        <CaretRight size={15} />
      </span>
    </button>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 26, borderRadius: 9999, flexShrink: 0,
        background: value ? '#DFA251' : 'rgba(80,60,40,0.16)',
        position: 'relative', transition: 'background 220ms ease',
        border: 'none', cursor: 'pointer',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 220ms ease',
      }} />
    </button>
  )
}
