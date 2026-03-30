import { NextRequest, NextResponse } from 'next/server'
import { checkGatewayHealth, AGENTS, listSessions, listAgents, getGatewayStatus } from '@/lib/openclaw'

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
  
  // Get gateway status (includes connection info)
  if (action === 'status') {
    const status = await getGatewayStatus()
    return NextResponse.json(status)
  }
  
  // List agents (via Gateway tool)
  if (action === 'list') {
    const result = await listAgents()
    return NextResponse.json({
      ...result,
      configured: AGENTS  // Include our configured agents
    })
  }
  
  // Get sessions
  if (action === 'sessions') {
    const result = await listSessions()
    return NextResponse.json(result)
  }
  
  // Get history for specific agent type
  if (action === 'history' && agentType) {
    const { getAgentHistory } = await import('@/lib/openclaw')
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

// POST /api/openclaw/agent - Send message to an agent
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
    
    // Use demo mode since HTTP API doesn't support sessions_send
    const { sendToAgent } = await import('@/lib/openclaw')
    
    const result = await sendToAgent(agentType, {
      taskId: taskId || 'general',
      type,
      content,
      timestamp: new Date()
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}