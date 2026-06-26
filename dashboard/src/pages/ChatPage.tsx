import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Shield, Trash2, Brain } from 'lucide-react'
import { API } from '../store'

interface Message {
  id: string
  role: 'user' | 'sheriff'
  content: string
  model_used?: string | null
  timestamp: Date
}

const QUICK_QUESTIONS = [
  '¿Hubo algo inusual hoy?',
  '¿A qué horas hay más actividad?',
  '¿Qué detectó el balcón hoy?',
  'Resumen de la semana',
]

export default function ChatPage() {
  const [messages, setMessages]             = useState<Message[]>([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { loadHistory() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch(`${API}/api/v1/sheriff/chat/history?limit=40`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.map((m: { id: string; role: string; content: string; model_used: string | null; timestamp: string }) => ({
          ...m, timestamp: new Date(m.timestamp),
        })))
      }
    } catch { /* silent */ }
    setLoadingHistory(false)
  }

  async function clearHistory() {
    if (!confirm('¿Borrar todo el historial?')) return
    await fetch(`${API}/api/v1/sheriff/chat/history`, { method: 'DELETE' })
    setMessages([])
  }

  async function sendMessage(text = input.trim()) {
    if (!text || loading) return
    setInput('')
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/v1/sheriff/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: 'sheriff',
          content: data.response, model_used: data.model_used,
          timestamp: new Date(),
        }])
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (e) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'sheriff',
        content: `Error al conectar: ${(e as Error).message}`,
        timestamp: new Date(),
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div
      style={{
        maxWidth: 480,
        display: 'flex', flexDirection: 'column',
        height: 'calc(100dvh - var(--nav-bottom-h) - 56px - 40px)',
        minHeight: 400,
      }}
    >

      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: 20, marginBottom: 8,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
          }}>
            <Shield size={22} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Sheriff IA
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 1 }}>
              Asistente de seguridad
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              color: 'var(--text-tertiary)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Trash2 size={13} /> Borrar
          </button>
        )}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
        {loadingHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, flexDirection: i % 2 ? 'row-reverse' : 'row' }}>
                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0 }} />
                <div className="skeleton" style={{ height: 64, flex: 1, borderRadius: 20 }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 24, textAlign: 'center',
            padding: '20px 0',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
            }}>
              <Shield size={34} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Sheriff IA</div>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                Pregúntame sobre la seguridad<br />de tu hogar
              </div>
            </div>
            {/* 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 360 }}>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                    fontSize: 13, fontWeight: 400, textAlign: 'left', lineHeight: 1.4,
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0 16px' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, alignSelf: 'flex-end',
                    background: msg.role === 'user' ? 'var(--surface-float)' : 'var(--accent-subtle)',
                    border: `1px solid ${msg.role === 'user' ? 'var(--border-default)' : 'var(--accent-border)'}`,
                  }}>
                    {msg.role === 'user'
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>A</span>
                      : <Shield size={15} style={{ color: 'var(--accent-text)' }} />
                    }
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: '78%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      padding: '13px 16px',
                      fontSize: 14, lineHeight: 1.55,
                      ...(msg.role === 'user'
                        ? {
                            background: 'var(--accent-subtle)',
                            border: '1px solid var(--accent-border)',
                            color: 'var(--text-primary)',
                            borderRadius: '20px 20px 5px 20px',
                          }
                        : {
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            borderRadius: '20px 20px 20px 5px',
                          }
                      ),
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, padding: '0 4px' }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-disabled)' }}>
                        {msg.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.model_used && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-disabled)' }}>
                          <Brain size={9} />
                          {msg.model_used.split('-')[1] ?? msg.model_used}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                  }}>
                    <Shield size={15} style={{ color: 'var(--accent-text)' }} />
                  </div>
                  <div style={{
                    padding: '13px 18px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '20px 20px 20px 5px',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Quick questions strip */}
      {messages.length > 0 && !loading && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, flexShrink: 0, marginTop: 12 }}>
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                fontSize: 12, cursor: 'pointer',
                color: 'var(--text-tertiary)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Pregunta al Sheriff..."
          disabled={loading}
          style={{
            flex: 1, padding: '13px 18px', borderRadius: 24,
            fontSize: 14, outline: 'none',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            opacity: loading ? 0.5 : 1,
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent-border)' }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--border-default)' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 48, height: 48, borderRadius: 24, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            background: 'var(--accent-default)',
            opacity: !input.trim() || loading ? 0.3 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <Send size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>
    </div>
  )
}
