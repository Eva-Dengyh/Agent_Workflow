// OpenClaw Agent Communication Client
// This module handles communication with OpenClaw agents via the Gateway API

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789'

export interface AgentConfig {
  agentId: string
  name: string
  type: 'planner' | 'coder' | 'reviewer'
}

export const AGENTS: Record<string, AgentConfig> = {
  planner: {
    agentId: process.env.PLANNER_AGENT_ID || 'planner_code_agent_bot',
    name: 'Planner',
    type: 'planner'
  },
  coder: {
    agentId: process.env.CODER_AGENT_ID || 'coder_code_agent_bot',
    name: 'Coder',
    type: 'coder'
  },
  reviewer: {
    agentId: process.env.REVIEWER_AGENT_ID || 'reviewer_code_agent_bot',
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
  message?: string
  data?: unknown
  error?: string
}

/**
 * Send a message to a specific agent via OpenClaw Gateway
 */
export async function sendToAgent(
  agentType: 'planner' | 'coder' | 'reviewer',
  message: TaskMessage,
  sessionKey?: string
): Promise<AgentResponse> {
  const agent = AGENTS[agentType]
  if (!agent) {
    return { success: false, error: `Unknown agent type: ${agentType}` }
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/api/sessions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Id': agent.agentId,
        ...(sessionKey && { 'X-Session-Key': sessionKey })
      },
      body: JSON.stringify({
        agentId: agent.agentId,
        message: {
          ...message,
          timestamp: message.timestamp.toISOString()
        }
      })
    })

    // Handle non-OK responses gracefully (404, etc.)
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return { success: false, error: `Gateway error ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    // Don't throw, return error object for graceful handling
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect to gateway' 
    }
  }
}

/**
 * Get conversation history with a specific agent
 */
export async function getAgentHistory(
  agentType: 'planner' | 'coder' | 'reviewer',
  limit: number = 50
): Promise<AgentResponse> {
  const agent = AGENTS[agentType]
  if (!agent) {
    return { success: false, error: `Unknown agent type: ${agentType}` }
  }

  try {
    const response = await fetch(
      `${GATEWAY_URL}/api/sessions/history?agentId=${agent.agentId}&limit=${limit}`
    )

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Gateway error: ${error}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch history' 
    }
  }
}

/**
 * List all active sessions
 */
export async function listSessions(): Promise<AgentResponse> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/sessions/list`)

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Gateway error: ${error}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list sessions' 
    }
  }
}

/**
 * Check if OpenClaw Gateway is reachable
 */
export async function checkGatewayHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(`${GATEWAY_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    // Gateway is not available - this is fine for demo mode
    console.warn('OpenClaw Gateway health check failed, running in demo mode')
    return false
  }
}

/**
 * Create a new task and dispatch to Planner
 */
export async function createAndDispatchTask(
  requirement: string,
  title?: string
): Promise<AgentResponse> {
  const taskId = `TASK-${Date.now()}`
  
  const message: TaskMessage = {
    taskId,
    type: 'new_task',
    content: `新任务: ${title || '未命名任务'}\n\n需求: ${requirement}`,
    timestamp: new Date()
  }

  return sendToAgent('planner', message)
}

/**
 * Send progress update from Coder to monitoring dashboard
 */
export async function updateCoderProgress(
  taskId: string,
  progress: number,
  module: string,
  log: string
): Promise<AgentResponse> {
  const message: TaskMessage = {
    taskId,
    type: 'progress_update',
    content: `进度: ${progress}% | 模块: ${module} | ${log}`,
    metadata: { progress, module },
    timestamp: new Date()
  }

  // This would typically send to a monitoring channel
  // For now, we just return success as the SSE will handle it
  return { success: true, message: 'Progress update sent' }
}

/**
 * Submit code for review (Coder → Reviewer)
 */
export async function submitForReview(
  taskId: string,
  codeSummary: string,
  files: { path: string; content: string }[]
): Promise<AgentResponse> {
  const message: TaskMessage = {
    taskId,
    type: 'submit_review',
    content: `代码审查请求\n\n摘要: ${codeSummary}\n\n文件数: ${files.length}`,
    metadata: { files: files.map(f => f.path) },
    timestamp: new Date()
  }

  return sendToAgent('reviewer', message)
}

/**
 * Send review feedback to Coder
 */
export async function sendReviewFeedback(
  taskId: string,
  issues: { severity: string; location: string; description: string; suggestion: string }[]
): Promise<AgentResponse> {
  const message: TaskMessage = {
    taskId,
    type: 'review_feedback',
    content: issues.length > 0 
      ? `发现 ${issues.length} 个问题需要修复`
      : '代码审查通过！',
    metadata: { issues },
    timestamp: new Date()
  }

  return sendToAgent('coder', message)
}