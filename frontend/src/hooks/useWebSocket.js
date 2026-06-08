import { useEffect, useRef } from 'react'
import { useSentinelStore } from '../store/sentinelStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stream'
const RECONNECT_DELAY = 3000

export function useWebSocket() {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const { addEvent, setWsStatus } = useSentinelStore()

  const connect = () => {
    setWsStatus('connecting')
    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        setWsStatus('connected')
        console.log('🟢 SentinelAI WebSocket connected')
      }

      ws.current.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          addEvent(data)
        } catch (e) {
          console.warn('WS parse error:', e)
        }
      }

      ws.current.onclose = () => {
        setWsStatus('disconnected')
        console.log('🔴 WS disconnected — reconnecting in 3s')
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    } catch (e) {
      setWsStatus('disconnected')
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [])

  return null
}
