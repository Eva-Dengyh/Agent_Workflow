import { NextRequest, NextResponse } from 'next/server'
import { AgentMessage } from '@/types'

// Store messages for demo
const messages: Map<string, AgentMessage[]> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentType, taskId, content, type = 'chat' } = body
    
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      taskId,
      agentType,
      type,
      content,
      timestamp: new Date(),
      metadata: body.metadata
    }
    
    const key = taskId || 'general'
    const existing = messages.get(key) || []
    messages.set(key, [...existing, message])
    
    // In production, this would use sessions_send to communicate with the agent
    // For now, simulate a response
    const response = await simulateAgentResponse(message)
    
    return NextResponse.json({ success: true, message, response })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

async function simulateAgentResponse(message: AgentMessage): Promise<Partial<AgentMessage>> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    id: `msg-${Date.now() + 1}`,
    agentType: message.agentType,
    type: 'chat',
    content: '收到消息，我会处理。',
    timestamp: new Date()
  }
}