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
  '¿Qué detectó la cámara del balcón?',
  '¿A qué horas hay más actividad?',
  'Dame un resumen de la semana',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadHistory()
  }, [])

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
          ...m,
          timestamp: new Date(m.timestamp),
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

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
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
        const sheriffMsg: Message = {
          id: crypto.randomUUID(),
          role: 'sheriff',
          content: data.response,
          model_used: data.model_used,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, sheriffMsg])
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (e) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'sheriff',
        content: `Error al conectar con el Sheriff: ${(e as Error).message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] border border-[#3B82F6]/30 flex items-center justify-center">
            <Shield size={20} className="text-[#3B82F6]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Sheriff IA</div>
            <div className="text-[10px] text-[#8080A0] font-mono">Asistente de seguridad</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#4A4A60] hover:text-[#FF3B3B] hover:bg-[#1A0505] transition-all border border-[#23232F]"
          >
            <Trash2 size={12} />
            Borrar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pb-4 pr-2">
        {loadingHistory ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 ? 'flex-row-reverse' : ''}`}>
                <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
                <div className="skeleton h-16 flex-1 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1A2E] border border-[#3B82F6]/20 flex items-center justify-center">
              <Shield size={32} className="text-[#3B82F6]" />
            </div>
            <div>
              <div className="text-white font-semibold mb-1">Sheriff IA</div>
              <div className="text-sm text-[#8080A0]">Pregúntame sobre la seguridad de tu hogar</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-2 bg-[#12121A] border border-[#23232F] rounded-xl text-xs text-[#8080A0] hover:text-white hover:border-[#3B82F6]/40 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-[#1A2040] border border-[#3B82F6]/30'
                        : 'bg-[#1A1A2E] border border-[#A78BFA]/30'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <span className="text-xs text-[#3B82F6] font-bold">A</span>
                    ) : (
                      <Shield size={14} className="text-[#A78BFA]" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#1A2040] border border-[#3B82F6]/20 text-white rounded-tr-sm'
                          : 'bg-[#12121A] border border-[#23232F] text-[#E0E0F0] rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-[#3A3A50] font-mono">
                        {msg.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.model_used && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#3A3A50]">
                          <Brain size={9} />
                          {msg.model_used.split('-')[1] ?? msg.model_used}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1A1A2E] border border-[#A78BFA]/30 flex items-center justify-center shrink-0">
                  <Shield size={14} className="text-[#A78BFA]" />
                </div>
                <div className="bg-[#12121A] border border-[#23232F] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions (when there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin shrink-0">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 bg-[#12121A] border border-[#23232F] rounded-xl text-[11px] text-[#8080A0] hover:text-white hover:border-[#3B82F6]/30 transition-all whitespace-nowrap shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Pregunta al Sheriff..."
          disabled={loading}
          className="flex-1 bg-[#12121A] border border-[#23232F] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4A4A60] focus:outline-none focus:border-[#3B82F6]/50 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#23232F] flex items-center justify-center transition-all disabled:cursor-not-allowed"
        >
          <Send size={16} className={loading ? 'text-[#4A4A60]' : 'text-white'} />
        </button>
      </div>
    </div>
  )
}
