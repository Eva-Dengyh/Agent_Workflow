// Server-only OpenClaw Gateway client
// This file should ONLY be imported in Server Components or API Routes

import fs from 'fs'
import path from 'path'

// Load gateway token from openclaw config
function getGatewayToken(): string | null {
  try {
    const configPath = path.join(process.env.HOME || '/Users/eva', '.openclaw/openclaw.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return config.gateway?.auth?.token || config.auth?.token || null
  } catch {
    return process.env.OPENCLAW_GATEWAY_TOKEN || null
  }
}

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = getGatewayToken()

export { GATEWAY_TOKEN, GATEWAY_URL }

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
  data?: unknown
  error?: string
  demo?: boolean
}

interface ToolResult {
  ok: boolean
  result?: {
    content?: Array<{ type: string; text: string }>
    details?: unknown
  }
  error?: {
    type: string
    message: string
  }
}

// Invoke a tool via Gateway HTTP API
export async function invokeTool(tool: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  if (!GATEWAY_TOKEN) {
    return { ok: false, error: { type: 'no_token', message: 'Gateway token not found' } }
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`
      },
      body: JSON.stringify({
        tool,
        action: 'json',
        args
      })
    })

    return await response.json()
  } catch (error) {
    return { 
      ok: false, 
      error: { type: 'network', message: error instanceof Error ? error.message : 'Connection failed' } 
    }
  }
}

// Demo mode responses
const DEMO_RESPONSES: Record<string, string> = {
  planner: '你好！我是 Planner。我收到你的消息了。有什么需求可以告诉我，我会帮你分析和规划任务。',
  coder: '你好！我是 Coder。我收到你的消息了。准备好开始开发了。',
  reviewer: '你好！我是 Reviewer。我收到你的消息了。可以提交代码给我审查。'
}

export function getDemoResponse(agentType: string): string {
  return DEMO_RESPONSES[agentType] || '消息已收到'
}

/**
 * Send a message to a specific agent
 * Note: Gateway HTTP API doesn't support sessions_send (blocked for security)
 */
export async function sendToAgent(
  agentType: 'planner' | 'coder' | 'reviewer',
  message: TaskMessage
): Promise<AgentResponse> {
  console.warn(`[OpenClaw] sendToAgent called for ${agentType} (HTTP API doesn't support sessions_send)`)
  
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
 * Get list of active sessions
 */
export async function listSessions(): Promise<AgentResponse> {
  const result = await invokeTool('sessions_list', {})
  
  if (!result.ok) {
    return { success: false, error: result.error?.message || 'Failed to list sessions' }
  }
  
  try {
    const text = result.result?.content?.[0]?.text || '{}'
    const data = JSON.parse(text)
    return { success: true, data: data.sessions || [] }
  } catch {
    return { success: false, error: 'Failed to parse sessions response' }
  }
}

/**
 * Get conversation history with a specific agent session
 */
export async function getAgentHistory(
  agentType: 'planner' | 'coder' | 'reviewer',
  limit: number = 50
): Promise<AgentResponse> {
  const sessionKey = `agent:${agentType}:${AGENTS[agentType].agentId}`
  
  const result = await invokeTool('sessions_history', { sessionKey, limit })
  
  if (!result.ok) {
    return { success: false, error: result.error?.message || 'Failed to get history' }
  }
  
  try {
    const text = result.result?.content?.[0]?.text || '{}'
    const data = JSON.parse(text)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to parse history response' }
  }
}

/**
 * List available agents
 */
export async function listAgents(): Promise<AgentResponse> {
  const result = await invokeTool('agents_list', {})
  
  if (!result.ok) {
    return { success: false, error: result.error?.message || 'Failed to list agents' }
  }
  
  try {
    const text = result.result?.content?.[0]?.text || '{}'
    const data = JSON.parse(text)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to parse agents response' }
  }
}

/**
 * Check if OpenClaw Gateway is reachable
 */
export async function checkGatewayHealth(): Promise<boolean> {
  if (!GATEWAY_TOKEN) {
    return false
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`
      },
      body: JSON.stringify({ tool: 'sessions_list', action: 'json', args: {} })
    })
    
    clearTimeout(timeoutId)
    const result = await response.json()
    return result.ok === true
  } catch {
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
  
  return {
    success: true,
    demo: true,
    data: { taskId }
  }
}

/**
 * Update Coder progress
 */
export async function updateCoderProgress(
  taskId: string,
  progress: number,
  module: string,
  log: string
): Promise<AgentResponse> {
  return { success: true, demo: true, data: { taskId, progress, module, log } }
}

/**
 * Submit code for review (Coder → Reviewer)
 */
export async function submitForReview(
  taskId: string,
  codeSummary: string,
  files: { path: string; content: string }[]
): Promise<AgentResponse> {
  return { success: true, demo: true, data: { taskId, summary: codeSummary, fileCount: files.length } }
}

/**
 * Send review feedback to Coder
 */
export async function sendReviewFeedback(
  taskId: string,
  issues: { severity: string; location: string; description: string; suggestion: string }[]
): Promise<AgentResponse> {
  return { success: true, demo: true, data: { taskId, issueCount: issues.length } }
}

/**
 * Get gateway connection status with details
 */
export async function getGatewayStatus(): Promise<{
  connected: boolean
  tokenFound: boolean
  sessions?: unknown[]
  error?: string
}> {
  if (!GATEWAY_TOKEN) {
    return { connected: false, tokenFound: false, error: 'Gateway token not found' }
  }
  
  const result = await listSessions()
  if (!result.success) {
    return { connected: false, tokenFound: true, error: result.error }
  }
  
  return { connected: true, tokenFound: true, sessions: result.data as unknown[] }
}