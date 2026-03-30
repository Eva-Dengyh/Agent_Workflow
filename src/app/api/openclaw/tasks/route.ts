import { NextRequest, NextResponse } from 'next/server'
import { createAndDispatchTask, updateCoderProgress, submitForReview, sendReviewFeedback, checkGatewayHealth } from '@/lib/server/openclaw'

// POST /api/openclaw/tasks - Create and dispatch a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, taskId, requirement, title, progress, module, log, codeSummary, files, issues } = body
    
    // Check if gateway is available
    const gatewayAvailable = await checkGatewayHealth()
    
    if (!gatewayAvailable) {
      // Demo mode: return mock success
      console.warn('OpenClaw Gateway not available, using demo mode')
      
      const mockTaskId = `TASK-${Date.now()}`
      
      if (action === 'create') {
        return NextResponse.json({
          success: true,
          demo: true,
          data: { taskId: mockTaskId },
          message: 'Task created in demo mode'
        })
      }
      
      if (action === 'progress') {
        return NextResponse.json({ success: true, demo: true, message: 'Progress updated in demo mode' })
      }
      
      if (action === 'review') {
        return NextResponse.json({ success: true, demo: true, message: 'Review submitted in demo mode' })
      }
      
      if (action === 'feedback') {
        return NextResponse.json({ success: true, demo: true, message: 'Feedback sent in demo mode' })
      }
    }
    
    let result
    
    switch (action) {
      case 'create':
        if (!requirement) {
          return NextResponse.json({ error: 'requirement is required for create action' }, { status: 400 })
        }
        result = await createAndDispatchTask(requirement, title)
        break
        
      case 'progress':
        if (!taskId || progress === undefined) {
          return NextResponse.json({ error: 'taskId and progress are required' }, { status: 400 })
        }
        result = await updateCoderProgress(taskId, progress, module || '', log || '')
        break
        
      case 'review':
        if (!taskId) {
          return NextResponse.json({ error: 'taskId is required for review action' }, { status: 400 })
        }
        result = await submitForReview(taskId, codeSummary || '', files || [])
        break
        
      case 'feedback':
        if (!taskId) {
          return NextResponse.json({ error: 'taskId is required for feedback action' }, { status: 400 })
        }
        result = await sendReviewFeedback(taskId, issues || [])
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, progress, review, or feedback' },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process task action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}