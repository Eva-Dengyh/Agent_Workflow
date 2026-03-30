import { NextRequest, NextResponse } from 'next/server'
import { Task, TaskStatus } from '@/types'

// In-memory store for demo
const tasks: Map<string, Task> = new Map()

export async function GET() {
  const taskList = Array.from(tasks.values())
  return NextResponse.json({ tasks: taskList })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const task: Task = {
      id: `TASK-${Date.now()}`,
      title: body.title || '新任务',
      status: 'pending' as TaskStatus,
      priority: body.priority || 'medium',
      requirement: body.requirement || '',
      plan: body.plan,
      progress: 0,
      currentModule: '',
      logs: [],
      reviewIssues: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: body.deadline
    }
    
    tasks.set(task.id, task)
    
    return NextResponse.json({ success: true, task })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}