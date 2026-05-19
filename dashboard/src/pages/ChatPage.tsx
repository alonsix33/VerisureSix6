import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Bot, User } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME = 'Soy el Sheriff. Pregúntame sobre la actividad de tu hogar.'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/v1/sheriff/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response || 'Sin respuesta' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error al conectar con el Sheriff.' },
      ])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare size={22} className="text-[var(--md-primary)]" />
        <h1 className="text-[var(--md-title-lg)] font-bold text-[var(--md-on-surface)] tracking-tight">
          Chat
        </h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-2 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 animate-fade-in ${m.role === 'user' ? 'justify-end' : ''}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[var(--md-primary)]/20 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-[var(--md-primary)]" />
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                  : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface)] border border-[var(--md-outline)]'
              }`}
            >
              {m.content}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[var(--md-primary)] flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--md-primary)]/20 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-[var(--md-primary)]" />
            </div>
            <div className="bg-[var(--md-surface-container)] border border-[var(--md-outline)] rounded-2xl px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-on-surface-variant)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-on-surface-variant)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-on-surface-variant)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — M3 Filled Text Field */}
      <div className="flex gap-2 bg-[var(--md-surface-container)] border border-[var(--md-outline)] rounded-full p-1.5 focus-within:ring-2 focus-within:ring-[var(--md-primary)] focus-within:border-transparent transition-all">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pregunta al Sheriff..."
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-2.5 bg-[var(--md-primary)] hover:bg-[var(--md-primary-container)] disabled:bg-[var(--md-surface-container-high)] rounded-full text-white disabled:text-[var(--md-on-surface-variant)] transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
