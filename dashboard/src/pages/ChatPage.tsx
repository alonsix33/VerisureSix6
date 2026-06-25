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
  '¿Qué detectó la cámara del balcón?',
  'Dame un resumen de la semana',
]

export default function ChatPage() {
  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState('')
  const [loading, setLoading]             = useState(false)
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
    if (!confirm('¿Borrar todo el historial de chat?')) return
    await fetch(`${API}/api/v1/sheriff/chat/history`, { method: 'DELETE' })
    setMessages([])
  }

  async function sendMessage(text = input.trim()) {
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
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
          id: crypto.randomUUID(),
          role: 'sheriff',
          content: data.response,
          model_used: data.model_used,
          timestamp: new Date(),
        }])
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (e) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'sheriff',
        content: `Error al conectar con el Sheriff: ${(e as Error).message}`,
        timestamp: new Date(),
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div
      className="max-w-2xl flex flex-col"
      style={{ height: 'calc(100dvh - 160px)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-4 pb-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}
          >
            <Shield size={20} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Sheriff IA</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--text-disabled)' }}>
              Asistente de seguridad
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--status-alert)'
              e.currentTarget.style.borderColor = 'var(--status-alert-border)'
              e.currentTarget.style.background = 'var(--status-alert-bg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Trash2 size={12} /> Borrar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-3 pr-1 min-h-0">
        {loadingHistory ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 ? 'flex-row-reverse' : ''}`}>
                <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
                <div className="skeleton h-14 flex-1 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}
            >
              <Shield size={32} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sheriff IA</div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Pregúntame sobre la seguridad de tu hogar
              </div>
            </div>
            {/* 2×2 quick question grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-2.5 rounded-xl text-xs text-left transition-all"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 self-end"
                  style={{
                    background: msg.role === 'user' ? 'var(--surface-float)' : 'var(--accent-subtle)',
                    border: `1px solid ${msg.role === 'user' ? 'var(--border-default)' : 'var(--accent-border)'}`,
                  }}
                >
                  {msg.role === 'user' ? (
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>A</span>
                  ) : (
                    <Shield size={14} style={{ color: 'var(--accent-text)' }} />
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex-1 max-w-[82%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className="px-4 py-3 text-sm leading-relaxed"
                    style={msg.role === 'user'
                      ? {
                          background: 'var(--accent-subtle)',
                          border: '1px solid var(--accent-border)',
                          color: 'var(--text-primary)',
                          borderRadius: '20px 20px 4px 20px',
                        }
                      : {
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          borderRadius: '20px 20px 20px 4px',
                        }
                    }
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-disabled)' }}>
                      {msg.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.model_used && (
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-disabled)' }}>
                        <Brain size={9} />
                        {msg.model_used.split('-')[1] ?? msg.model_used}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}
                >
                  <Shield size={14} style={{ color: 'var(--accent-text)' }} />
                </div>
                <div
                  className="px-4 py-3 flex items-center gap-1.5"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '20px 20px 20px 4px',
                  }}
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions strip (when there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap shrink-0 transition-all"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 mt-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Pregunta al Sheriff..."
          disabled={loading}
          className="flex-1 px-4 py-3 text-sm rounded-xl outline-none transition-all disabled:opacity-50"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent-border)' }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--border-default)' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'var(--accent-default)' }}
        >
          <Send size={16} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>
    </div>
  )
}
