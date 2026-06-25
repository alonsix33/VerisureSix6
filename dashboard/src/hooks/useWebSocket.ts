import { useEffect, useRef } from 'react'
import { useStore } from '../store'

function deriveWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  return apiUrl.replace(/^http/, 'ws') + '/ws/events'
}
const WS_URL = deriveWsUrl()

export function useWebSocket() {
  const addEvent = useStore((s) => s.addEvent)
  const setWsConnected = useStore((s) => s.setWsConnected)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setWsConnected(true)

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          if (data.type === 'event' && data.data) {
            addEvent(data.data)
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [addEvent, setWsConnected])
}
