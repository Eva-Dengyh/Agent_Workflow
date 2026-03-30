// OpenClaw Gateway WebSocket Client
// Enables real-time communication including sessions_send

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export interface WSMessage {
  type: 'req' | 'res' | 'event'
  id?: string
  method?: string
  event?: string
  params?: Record<string, unknown>
  ok?: boolean
  payload?: unknown
  error?: { type: string; message: string }
}

export interface UseOpenClawWSOptions {
  gatewayUrl?: string
  token: string
  onConnect?: () => void
  onDisconnect?: () => void
  onMessage?: (msg: WSMessage) => void
  onError?: (error: Error) => void
}

export interface UseOpenClawWSReturn {
  connected: boolean
  connecting: boolean
  connect: () => void
  disconnect: () => void
  send: (method: string, params?: Record<string, unknown>) => Promise<WSMessage | null>
  lastMessage: WSMessage | null
}

let messageIdCounter = 0

function generateId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`
}

export function useOpenClawWS(options: UseOpenClawWSOptions): UseOpenClawWSReturn {
  const {
    gatewayUrl = 'ws://localhost:18789',
    token,
    onConnect,
    onDisconnect,
    onMessage,
    onError
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRequestsRef = useRef<Map<string, { resolve: (msg: WSMessage) => void; reject: (err: Error) => void }>>(new Map())

  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  // Handle incoming messages
  const handleMessage = useCallback((msg: WSMessage) => {
    setLastMessage(msg)

    // Handle response to our request
    if (msg.type === 'res' && msg.id && pendingRequestsRef.current.has(msg.id)) {
      const pending = pendingRequestsRef.current.get(msg.id)!
      pendingRequestsRef.current.delete(msg.id)
      pending.resolve(msg)
    }

    // Pass to callback
    onMessage?.(msg)
  }, [onMessage])

  // Send a request and wait for response
  const send = useCallback((method: string, params: Record<string, unknown> = {}): Promise<WSMessage | null> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const id = generateId()
      const request: WSMessage = {
        type: 'req',
        id,
        method,
        params
      }

      pendingRequestsRef.current.set(id, { resolve, reject })
      wsRef.current.send(JSON.stringify(request))

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id)
          reject(new Error(`Request ${method} timed out`))
        }
      }, 30000)
    })
  }, [])

  // Connect to Gateway
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || connecting) {
      return
    }

    setConnecting(true)

    try {
      const ws = new WebSocket(gatewayUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[OpenClaw WS] Connected, sending handshake...')
        setConnecting(false)
        setConnected(true)
        onConnect?.()

        // Send connect request
        const connectRequest: WSMessage = {
          type: 'req',
          id: generateId(),
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'multi-agent-platform',
              version: '1.0.0',
              platform: 'web',
              mode: 'operator'
            },
            role: 'operator',
            scopes: ['operator.read', 'operator.write', 'operator.admin'],
            caps: [],
            commands: [],
            permissions: {},
            auth: { token },
            locale: 'zh-CN',
            userAgent: 'MultiAgentPlatform/1.0'
          }
        }

        ws.send(JSON.stringify(connectRequest))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage

          // Handle connect challenge
          if (msg.type === 'event' && msg.event === 'connect.challenge') {
            console.log('[OpenClaw WS] Received challenge, auth in progress...')
            return
          }

          // Handle connect response
          if (msg.payload && typeof msg.payload === 'object' && 'type' in msg.payload && (msg.payload as Record<string, unknown>).type === 'hello-ok') {
            console.log('[OpenClaw WS] Handshake successful!')
          }

          handleMessage(msg)
        } catch (err) {
          console.error('[OpenClaw WS] Failed to parse message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('[OpenClaw WS] Error:', event)
        onError?.(new Error('WebSocket error'))
      }

      ws.onclose = () => {
        console.log('[OpenClaw WS] Disconnected')
        setConnected(false)
        setConnecting(false)
        onDisconnect?.()

        // Auto reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[OpenClaw WS] Attempting reconnect...')
          connect()
        }, 5000)
      }
    } catch (err) {
      console.error('[OpenClaw WS] Connection failed:', err)
      setConnecting(false)
      onError?.(err instanceof Error ? err : new Error('Connection failed'))
    }
  }, [gatewayUrl, token, connecting, onConnect, onDisconnect, onError, handleMessage])

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnected(false)
    setConnecting(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
      pendingRequestsRef.current.clear()
    }
  }, [disconnect])

  return {
    connected,
    connecting,
    connect,
    disconnect,
    send,
    lastMessage
  }
}

/**
 * Send a message to an agent via WebSocket
 * This is the real implementation that bypasses HTTP API restrictions
 */
export async function sendAgentMessageViaWS(
  ws: { send: (method: string, params?: Record<string, unknown>) => Promise<WSMessage | null> },
  agentId: string,
  message: string,
  sessionKey?: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    // Note: sessions.send is not directly available as a WS method
    // We need to use the agent's session to send messages
    // This requires knowing the session key for the specific agent
    
    const targetSession = sessionKey || `agent:${agentId}:${agentId}`
    
    // Send via the sessions.send tool if available
    const response = await ws.send('invoke', {
      tool: 'sessions_send',
      args: {
        sessionKey: targetSession,
        message: {
          type: 'text',
          text: message
        }
      }
    })

    if (response?.ok) {
      return { success: true, response: response.payload as string }
    } else {
      return { success: false, error: response?.error?.message || 'Failed to send message' }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}