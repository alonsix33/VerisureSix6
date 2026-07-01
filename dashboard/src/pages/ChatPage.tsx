import { useState, useRef, useEffect } from 'react'
import { useStore, API } from '../store'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import { MODE_COLOR_RAW } from '../lib/design'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  ts: number
}

const QUICK = [
  '¿Cómo está la casa ahora?',
  '¿Pasó algo mientras no estuve?',
  '¿Están bien las cámaras?',
  'Cuéntame el resumen del día',
]

function pad(n: number) { return String(n).padStart(2, '0') }
function msgTime(ts: number) {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ChatPage() {
  const mode      = useStore((s) => s.config?.mode ?? 'fuera')
  const modeColor = MODE_COLOR_RAW[mode] ?? MODE_COLOR_RAW.fuera

  const [msgs, setMsgs]     = useState<Message[]>([])
  const [input, setInput]   = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const bottomRef           = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setInput('')
    setError(null)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed, ts: Date.now() }
    setMsgs((prev) => [...prev, userMsg])
    setTyping(true)

    try {
      const res = await fetch(`${API}/api/v1/sheriff/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response ?? data.message ?? 'Sin respuesta',
        ts: Date.now(),
      }
      setMsgs((prev) => [...prev, reply])
    } catch {
      setError('No pude conectar con Sheriff. Intenta de nuevo.')
    } finally {
      setTyping(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); send(input) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 84px)', maxHeight: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '54px 18px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        borderBottom: '1px solid rgba(80,60,40,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <SheriffOrb size={38} radius={13} modeColor={modeColor}
            style={{ animation: 'scBreathe 3s ease-in-out infinite', boxShadow: '0 5px 14px rgba(223,162,81,0.38)', transition: 'background 600ms ease' }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Sheriff
            </div>
            <div style={{ fontSize: 11, color: '#7A7065' }}>
              siempre atento, con calma
            </div>
          </div>
        </div>
        <button
          onClick={() => { setMsgs([]); setError(null) }}
          style={{
            background: 'var(--surface-card)', border: '1px solid rgba(80,60,40,0.10)',
            color: '#7A7065', fontSize: 12, fontWeight: 500,
            padding: '7px 13px', borderRadius: 9999, cursor: 'pointer',
          }}
        >
          Nuevo
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 8px', display: 'flex', flexDirection: 'column', gap: 11 }}>

        {msgs.length === 0 && !typing && (
          <EmptyState modeColor={modeColor} onAsk={send} />
        )}

        {msgs.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              padding: '11px 14px',
              borderRadius: msg.role === 'user'
                ? '18px 18px 6px 18px'
                : '18px 18px 18px 6px',
              background: msg.role === 'user' ? 'var(--surface-hero)' : 'var(--surface-card)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(80,60,40,0.08)',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: msg.role === 'user' ? '#F2EADD' : '#2C2723' }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 9, color: '#ADA293', marginTop: 5, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {msgTime(msg.ts)}
              </div>
            </div>
          </div>
        ))}

        {typing && <TypingIndicator />}

        {error && (
          <div style={{
            padding: '11px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--level-importante-bg)',
            border: '1px solid rgba(194,98,72,0.25)',
            fontSize: 13, color: 'var(--level-importante-text)',
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick strip (horizontal scroll when chat has messages) */}
      {msgs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '4px 18px 8px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              style={{
                flexShrink: 0, padding: '8px 13px', borderRadius: 9999,
                background: 'var(--surface-card)', border: '1px solid rgba(80,60,40,0.10)',
                fontSize: 12, color: '#7A7065', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        flexShrink: 0, padding: '8px 18px 10px',
        borderTop: '1px solid rgba(80,60,40,0.07)',
        background: '#F2EADD',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 5px 5px 16px',
          borderRadius: 9999,
          background: 'var(--surface-card)',
          border: `1px solid ${input.trim() ? 'var(--accent-border)' : 'var(--border-medium)'}`,
          transition: 'border-color 200ms ease',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Escribe a Sheriff..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#2C2723', fontSize: 14, fontFamily: 'var(--font-ui)', minWidth: 0,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            style={{
              width: 37, height: 37, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: input.trim() && !typing ? 'var(--accent)' : 'var(--surface-input)',
              boxShadow: input.trim() && !typing ? '0 4px 12px rgba(223,162,81,0.30)' : 'none',
              color: input.trim() && !typing ? '#2C2723' : 'var(--text-disabled)',
              transition: 'all 200ms ease', border: 'none', cursor: 'pointer',
            }}
          >
            <PaperPlaneTilt size={16} weight="fill" />
          </button>
        </div>
      </div>

    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        height: 36, padding: '0 16px',
        borderRadius: '20px 20px 20px 6px',
        background: 'var(--surface-card)',
        border: '1px solid rgba(80,60,40,0.08)',
      }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="anim-wave"
            style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--accent)', animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ modeColor, onAsk }: { modeColor: string; onAsk: (q: string) => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', textAlign: 'center' }}>
      <SheriffOrb
        size={96} radius={32} modeColor={modeColor} glow
        style={{ marginBottom: 24, animation: 'scBreathe 3s ease-in-out infinite', transition: 'background 600ms ease' }}
      />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#2C2723', marginBottom: 6, letterSpacing: '-0.3px' }}>
        Hola, Alonso.
      </div>
      <div style={{ fontSize: 14, color: '#7A7065', maxWidth: 260, marginBottom: 26 }}>
        Pregúntame por tu casa cuando quieras. Estoy para darte tranquilidad.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => onAsk(q)}
            style={{
              textAlign: 'left', padding: 13, borderRadius: 16,
              background: '#FFFCF6', border: '1px solid rgba(80,60,40,0.08)',
              fontSize: 12, lineHeight: 1.35, color: '#4A433B',
              cursor: 'pointer', fontFamily: 'var(--font-ui)',
              boxShadow: '0 4px 14px rgba(80,55,25,0.04)',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function SheriffOrb({ size, radius, modeColor, glow, style }: {
  size: number
  radius: number
  modeColor?: string
  glow?: boolean
  style?: React.CSSProperties
}) {
  const mc = modeColor ?? '#DFA251'
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `radial-gradient(circle at 34% 30%, ${mc}, #DFA251 70%)`,
      boxShadow: glow ? '0 16px 38px rgba(223,162,81,0.32)' : '0 2px 10px rgba(223,162,81,0.22)',
      ...style,
    }} />
  )
}
