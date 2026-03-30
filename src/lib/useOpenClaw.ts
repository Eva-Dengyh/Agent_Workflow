import { useEffect, useCallback, useRef } from 'react'
import { useAgentStore } from '@/store/agentStore'
import { useSSEStore } from '@/store/sseStore'
import { useTaskStore } from '@/store/taskStore'
import { checkGatewayHealth, AGENTS, sendToAgent, type TaskMessage } from '@/lib/openclaw'

interface UseOpenClawOptions {
  autoConnect?: boolean
  onAgentMessage?: (agentType: string, message: TaskMessage) => void
  onTaskUpdate?: (taskId: string, data: unknown) => void
}

export function useOpenClaw(options: UseOpenClawOptions = {}) {
  const { autoConnect = true, onAgentMessage, onTaskUpdate } = options
  
  const { agents, updateAgentStatus, setAgentWorking, setAgentIdle } = useAgentStore()
  const { setConnected, addEvent } = useSSEStore()
  const { updateTask, addLog } = useTaskStore()
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  
  // Check gateway health on mount
  const checkHealth = useCallback(async () => {
    const isHealthy = await checkGatewayHealth()
    setConnected(isHealthy)
    return isHealthy
  }, [setConnected])
  
  // Connect to SSE for real-time updates
  const connect = useCallback(async () => {
    if (isConnectingRef.current) return
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    isConnectingRef.current = true
    
    try {
      const eventSource = new EventSource('/api/events')
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        setConnected(true)
        isConnectingRef.current = false
        addEvent({
          type: 'notification',
          data: { message: 'Connected to OpenClaw Gateway' },
          timestamp: new Date()
        })
      }
      
      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different event types
          if (data.type === 'agent_status') {
            // Update agent statuses
            const statusData = data.data as Record<string, { status: string; currentTask?: string }>
            Object.entries(statusData).forEach(([agentType, status]) => {
              if (agentType in AGENTS) {
                updateAgentStatus(agentType as 'planner' | 'coder' | 'reviewer', {
                  status: status.status === 'working' ? 'working' : 'idle',
                  currentTask: status.currentTask,
                  lastActive: new Date()
                })
              }
            })
          }
          
          if (data.type === 'task_update' && onTaskUpdate) {
            onTaskUpdate(data.taskId, data.data)
          }
          
          if (data.type === 'agent_message' && onAgentMessage) {
            onAgentMessage(data.agentType, data.message)
          }
          
          addEvent({
            type: data.type,
            data: data.data || data,
            timestamp: new Date()
          })
        } catch {
          // Ignore parse errors
        }
      }
      
      eventSource.onerror = () => {
        setConnected(false)
        eventSource.close()
        isConnectingRef.current = false
        
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }
    } catch {
      setConnected(false)
      isConnectingRef.current = false
    }
  }, [setConnected, addEvent, updateAgentStatus, onAgentMessage, onTaskUpdate])
  
  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setConnected(false)
  }, [setConnected])
  
  // Send message to agent
  const sendMessage = useCallback(async (
    agentType: 'planner' | 'coder' | 'reviewer',
    taskId: string,
    content: string,
    type: TaskMessage['type'] = 'chat'
  ) => {
    const message: TaskMessage = {
      taskId,
      type,
      content,
      timestamp: new Date()
    }
    
    // Set agent to working state
    setAgentWorking(agentType, taskId)
    
    const result = await sendToAgent(agentType, message)
    
    if (!result.success) {
      // Revert to idle on error
      setAgentIdle(agentType)
      addLog(taskId, {
        timestamp: new Date(),
        level: 'error',
        message: `Failed to send to ${agentType}: ${result.error}`,
        source: 'system'
      })
    } else {
      addLog(taskId, {
        timestamp: new Date(),
        level: 'info',
        message: `Message sent to ${agentType}: ${content.slice(0, 50)}...`,
        source: 'system'
      })
    }
    
    return result
  }, [setAgentWorking, setAgentIdle, addLog])
  
  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      checkHealth().then(isHealthy => {
        if (isHealthy) {
          connect()
        }
      })
    }
    
    return () => {
      disconnect()
    }
  }, [autoConnect, checkHealth, connect, disconnect])
  
  return {
    agents,
    connect,
    disconnect,
    sendMessage,
    checkHealth
  }
}