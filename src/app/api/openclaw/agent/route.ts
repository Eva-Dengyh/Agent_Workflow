import { NextRequest, NextResponse } from 'next/server'
import { checkGatewayHealth, AGENTS, listSessions, listAgents, getGatewayStatus } from '@/lib/server/openclaw'
import { getAgentHistory } from '@/lib/server/openclaw'

// GET /api/openclaw/agent - Get agent status, history, or gateway info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const agentType = searchParams.get('agentType')
  
  // Health check
  if (action === 'health') {
    const isHealthy = await checkGatewayHealth()
    return NextResponse.json({ healthy: isHealthy })
  }
  
  // Get gateway status
  if (action === 'status') {
    const status = await getGatewayStatus()
    return NextResponse.json(status)
  }
  
  // List agents
  if (action === 'list') {
    const result = await listAgents()
    return NextResponse.json({ ...result, configured: AGENTS })
  }
  
  // Get sessions
  if (action === 'sessions') {
    const result = await listSessions()
    return NextResponse.json(result)
  }
  
  // Get history for specific agent type
  if (action === 'history' && agentType) {
    const result = await getAgentHistory(agentType as 'planner' | 'coder' | 'reviewer')
    return NextResponse.json(result)
  }
  
  // Default: show all agents with their status
  const status = await getGatewayStatus()
  return NextResponse.json({
    gateway: status,
    agents: AGENTS,
    message: 'Use ?action=health|status|list|sessions|history to query specific info'
  })
}

// POST /api/openclaw/agent - Send message to an agent via hooks API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentType, taskId, content, type = 'chat' } = body
    
    if (!agentType || !content) {
      return NextResponse.json(
        { error: 'agentType and content are required' },
        { status: 400 }
      )
    }
    
    if (!['planner', 'coder', 'reviewer'].includes(agentType)) {
      return NextResponse.json(
        { error: 'Invalid agentType. Must be planner, coder, or reviewer' },
        { status: 400 }
      )
    }
    
    // Use hooks API for real agent communication
    const { sendToAgent } = await import('@/lib/server/hooks')
    const result = await sendToAgent(agentType, content, taskId)
    
    return NextResponse.json({
      success: result.success,
      demo: result.demo,
      data: result.data,
      error: result.error
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}