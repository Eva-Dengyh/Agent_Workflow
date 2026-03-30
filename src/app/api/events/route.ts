import { NextRequest, NextResponse } from 'next/server'
import { SSEEvent } from '@/types'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectEvent: SSEEvent = {
        type: 'notification',
        data: { message: 'Connected to SSE stream' },
        timestamp: new Date()
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`))

      // Send periodic heartbeats and status updates
      const interval = setInterval(() => {
        const event: SSEEvent = {
          type: 'agent_status',
          data: {
            planner: { status: 'idle', lastActive: new Date() },
            coder: { status: 'working', currentTask: 'TASK-001', lastActive: new Date() },
            reviewer: { status: 'idle', lastActive: new Date() }
          },
          timestamp: new Date()
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }, 5000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  })
}