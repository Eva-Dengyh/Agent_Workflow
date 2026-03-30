import { NextRequest, NextResponse } from 'next/server'
import { sendToAgent, getAgentHistory, listSessions, checkGatewayHealth, AGENTS } from '@/lib/openclaw'

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

// GET /api/openclaw/agent - Get agent status or history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const agentType = searchParams.get('agentType')
  
  // Health check
  if (action === 'health') {
    const isHealthy = await checkGatewayHealth()
    return NextResponse.json({ healthy: isHealthy })
  }
  
  // List agents
  if (action === 'list') {
    return NextResponse.json({ agents: AGENTS })
  }
  
  // Get history
  if (action === 'history' && agentType) {
    const result = await getAgentHistory(agentType as 'planner' | 'coder' | 'reviewer')
    return NextResponse.json(result)
  }
  
  // List sessions
  if (action === 'sessions') {
    const result = await listSessions()
    return NextResponse.json(result)
  }
  
  return NextResponse.json(
    { error: 'Invalid action. Use: health, list, history, or sessions' },
    { status: 400 }
  )
}