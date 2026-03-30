import { NextResponse } from 'next/server'
import { getGatewayStatus } from '@/lib/server/openclaw'

// GET /api/openclaw/ws-token - Get WebSocket connection info
// Returns token for client-side WebSocket connection
export async function GET() {
  const status = await getGatewayStatus()
  
  if (!status.connected) {
    return NextResponse.json({
      error: 'Gateway not connected',
      canConnect: false
    }, { status: 503 })
  }
  
  // In a real app, we'd generate a temporary token with limited scopes
  // For now, we return a placeholder - client will use the config token directly
  return NextResponse.json({
    canConnect: true,
    wsUrl: process.env.OPENCLAW_WS_URL || 'ws://localhost:18789',
    message: 'WebSocket connection requires client to use token from config'
  })
}