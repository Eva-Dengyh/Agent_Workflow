import { NextRequest, NextResponse } from 'next/server'
import { createAndDispatchTask, updateCoderProgress, submitForReview, sendReviewFeedback, checkGatewayHealth } from '@/lib/openclaw'

// POST /api/openclaw/tasks - Create and dispatch a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, taskId, requirement, title, progress, module, log, codeSummary, files, issues } = body
    
    // Check if gateway is available
    const gatewayAvailable = await checkGatewayHealth()
    
    if (!gatewayAvailable) {
      // Fallback mode: return mock success for demo purposes
      console.warn('OpenClaw Gateway not available, using local mode')
      
      const mockTaskId = `TASK-${Date.now()}`
      
      if (action === 'create') {
        return NextResponse.json({
          success: true,
          data: { taskId: mockTaskId },
          message: 'Task created in local mode (Gateway unavailable)'
        })
      }
      
      if (action === 'progress') {
        return NextResponse.json({ success: true, message: 'Progress updated in local mode' })
      }
      
      if (action === 'review') {
        return NextResponse.json({ success: true, message: 'Review submitted in local mode' })
      }
      
      if (action === 'feedback') {
        return NextResponse.json({ success: true, message: 'Feedback sent in local mode' })
      }
    }
    
    let result
    
    switch (action) {
      case 'create':
        // Create new task and dispatch to Planner
        if (!requirement) {
          return NextResponse.json(
            { error: 'requirement is required for create action' },
            { status: 400 }
          )
        }
        result = await createAndDispatchTask(requirement, title)
        break
        
      case 'progress':
        // Update Coder progress
        if (!taskId || progress === undefined) {
          return NextResponse.json(
            { error: 'taskId and progress are required for progress action' },
            { status: 400 }
          )
        }
        result = await updateCoderProgress(taskId, progress, module || '', log || '')
        break
        
      case 'review':
        // Submit for review (Coder → Reviewer)
        if (!taskId) {
          return NextResponse.json(
            { error: 'taskId is required for review action' },
            { status: 400 }
          )
        }
        result = await submitForReview(taskId, codeSummary || '', files || [])
        break
        
      case 'feedback':
        // Send review feedback (Reviewer → Coder)
        if (!taskId) {
          return NextResponse.json(
            { error: 'taskId is required for feedback action' },
            { status: 400 }
          )
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