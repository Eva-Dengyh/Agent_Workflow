// Client-safe OpenClaw Agent Communication Client
// This file can be imported in both Client and Server Components

export interface AgentConfig {
  agentId: string
  name: string
  type: 'planner' | 'coder' | 'reviewer'
}

export const AGENTS: Record<string, AgentConfig> = {
  planner: {
    agentId: process.env.NEXT_PUBLIC_CODER_AGENT_ID || 'coder_code_agent_bot',
    name: 'Coder',
    type: 'coder'
  },
  coder: {
    agentId: process.env.NEXT_PUBLIC_PLANNER_AGENT_ID || 'planner_code_agent_bot',
    name: 'Planner',
    type: 'planner'
  },
  reviewer: {
    agentId: process.env.NEXT_PUBLIC_REVIEWER_AGENT_ID || 'reviewer_code_agent_bot',
    name: 'Reviewer',
    type: 'reviewer'
  }
}

export interface TaskMessage {
  taskId: string
  type: 'new_task' | 'progress_update' | 'submit_review' | 'review_feedback' | 'task_completed' | 'chat'
  content: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

export interface AgentResponse {
  success: boolean
  data?: unknown
  error?: string
  demo?: boolean
}

// Demo mode responses
const DEMO_RESPONSES: Record<string, string> = {
  planner: '你好！我是 Planner。我收到你的消息了。有什么需求可以告诉我，我会帮你分析和规划任务。',
  coder: '你好！我是 Coder。我收到你的消息了。准备好开始开发了。',
  reviewer: '你好！我是 Reviewer。我收到你的消息了。可以提交代码给我审查。'
}

/**
 * Client-side check if Gateway is reachable
 * Note: This makes a request to our Next.js API which proxies to Gateway
 */
export async function checkGatewayHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/openclaw/agent?action=health')
    const data = await response.json()
    return data.healthy === true
  } catch {
    return false
  }
}

/**
 * Get Gateway status via our API
 */
export async function getGatewayStatus(): Promise<{
  connected: boolean
  tokenFound: boolean
  sessions?: unknown[]
  error?: string
}> {
  try {
    const response = await fetch('/api/openclaw/agent?action=status')
    return await response.json()
  } catch (error) {
    return { 
      connected: false, 
      tokenFound: false, 
      error: error instanceof Error ? error.message : 'Failed to connect' 
    }
  }
}

/**
 * Send message to agent via our API (demo mode since HTTP API blocks sessions_send)
 */
export async function sendToAgent(
  agentType: 'planner' | 'coder' | 'reviewer',
  message: TaskMessage
): Promise<AgentResponse> {
  // Demo mode - real implementation would go through WebSocket
  return {
    success: true,
    demo: true,
    data: {
      content: DEMO_RESPONSES[agentType] || '消息已收到',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get conversation history for an agent
 */
export async function getAgentHistory(
  agentType: 'planner' | 'coder' | 'reviewer',
  limit: number = 50
): Promise<AgentResponse> {
  try {
    const response = await fetch(`/api/openclaw/agent?action=history&agentType=${agentType}&limit=${limit}`)
    return await response.json()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get history' }
  }
}

/**
 * Get list of active sessions
 */
export async function listSessions(): Promise<AgentResponse> {
  try {
    const response = await fetch('/api/openclaw/agent?action=sessions')
    return await response.json()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list sessions' }
  }
}

/**
 * List available agents
 */
export async function listAgents(): Promise<AgentResponse> {
  try {
    const response = await fetch('/api/openclaw/agent?action=list')
    return await response.json()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list agents' }
  }
}