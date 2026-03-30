import { NextRequest, NextResponse } from 'next/server'

// In-memory message store
const messageStore: Map<string, any[]> = new Map()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId') || 'general'
  
  const messages = messageStore.get(taskId) || []
  
  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId = 'general', message } = body
    
    const existing = messageStore.get(taskId) || []
    messageStore.set(taskId, [...existing, message])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store message' },
      { status: 500 }
    )
  }
}