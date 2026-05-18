import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Soy el Sheriff. Pregúntame sobre la actividad de tu hogar.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl">
      <h1 className="text-lg font-bold text-white mb-4">Chat con el Sheriff</h1>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-2 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400">
              Pensando...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pregunta al Sheriff..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl text-sm text-white font-medium transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
