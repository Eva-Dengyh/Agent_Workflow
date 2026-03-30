// Server-side: Use OpenAI-compatible /v1/chat/completions API to send messages to OpenClaw agents
// This is the recommended approach for agent communication

import { NextResponse } from 'next/server'
import { GATEWAY_URL, GATEWAY_TOKEN } from '@/lib/server/openclaw'

interface ChatCompletionRequest {
  model: string // Format: openclaw:<agentId>
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  max_tokens?: number
  temperature?: number
}

/**
 * Send a message to an agent via OpenAI-compatible API
 * Uses POST /v1/chat/completions endpoint
 * NOTE: This endpoint requires longer timeout (10+ seconds) as it invokes real AI agent
 */
export async function sendToAgentViaOpenAI(
  agentId: string,
  message: string,
  options: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {}
): Promise<{
  success: boolean
  response?: string
  error?: string
}> {
  if (!GATEWAY_TOKEN) {
    return { success: false, error: 'Gateway token not available' }
  }

  const timeoutMs = options.timeoutMs || 30000 // Default 30 second timeout for AI response

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const request: ChatCompletionRequest = {
      model: `openclaw:${agentId}`,
      messages: [
        { role: 'user', content: message }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    }

    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`
      },
      body: JSON.stringify(request),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `OpenAI API failed (${response.status}): ${errorText}`
      }
    }

    const data = await response.json()

    // Extract response from OpenAI format
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, error: 'No response content from agent' }
    }

    return {
      success: true,
      response: content
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: `Request timed out after ${timeoutMs}ms` }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

/**
 * Send message to specific agent
 */
export async function sendToAgent(
  agentType: 'planner' | 'coder' | 'reviewer',
  message: string,
  taskId?: string
): Promise<{
  success: boolean
  data?: {
    content: string
    timestamp: string
  }
  error?: string
  demo?: boolean
}> {
  // Agent IDs from environment - use EXACT IDs
  const AGENT_IDS = {
    planner: process.env.PLANNER_AGENT_ID || 'planner_code_agent_bot',
    coder: process.env.CODER_AGENT_ID || 'coder_code_agent_bot',
    reviewer: process.env.REVIEWER_AGENT_ID || 'reviewer_code_agent_bot'
  }

  // Model format: openclaw:<exact-agent-id>
  const modelMap = {
    planner: 'openclaw:planner_code_agent_bot',
    coder: 'openclaw:coder_code_agent_bot',
    reviewer: 'openclaw:reviewer_code_agent_bot'
  }

  const agentId = AGENT_IDS[agentType]
  const fullMessage = taskId ? `[Task: ${taskId}]\n\n${message}` : message
  const model = modelMap[agentType]

  try {
    const result = await sendToAgentViaOpenAI(model, fullMessage)

    if (result.success && result.response) {
      return {
        success: true,
        demo: false,
        data: {
          content: result.response,
          timestamp: new Date().toISOString()
        }
      }
    } else {
      console.error(`[OpenClaw] Agent ${agentType} failed:`, result.error)

      return {
        success: true,
        demo: true,
        data: {
          content: getDemoResponse(agentType),
          timestamp: new Date().toISOString()
        }
      }
    }
  } catch (error) {
    console.error(`[OpenClaw] Agent ${agentType} error:`, error)

    return {
      success: true,
      demo: true,
      data: {
        content: getDemoResponse(agentType),
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Demo responses
function getDemoResponse(agentType: string): string {
  const responses: Record<string, string> = {
    planner: '你好！我是 Planner。我收到你的消息了。有什么需求可以告诉我，我会帮你分析和规划任务。',
    coder: '你好！我是 Coder。我收到你的消息了。准备好开始开发了。',
    reviewer: '你好！我是 Reviewer。我收到你的消息了。可以提交代码给我审查。'
  }
  return responses[agentType] || '消息已收到'
}

/**
 * Check if the /v1/chat/completions endpoint is enabled
 */
export async function checkOpenAIEndpoint(): Promise<boolean> {
  if (!GATEWAY_TOKEN) return false

  try {
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`
      },
      body: JSON.stringify({
        model: 'openclaw:main',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    })

    // 401 means endpoint exists but auth works, 404 means not enabled
    return response.status !== 404
  } catch {
    return false
  }
}