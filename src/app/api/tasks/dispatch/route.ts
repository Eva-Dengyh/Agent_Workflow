import { NextRequest, NextResponse } from 'next/server'
import { Task } from '@/types'

const tasks: Map<string, Task> = new Map()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('id')
  
  if (taskId) {
    const task = tasks.get(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    return NextResponse.json({ task })
  }
  
  return NextResponse.json({ tasks: Array.from(tasks.values()) })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, ...updates } = body
    
    const task = tasks.get(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    const updatedTask = { ...task, ...updates, updatedAt: new Date() }
    tasks.set(taskId, updatedTask)
    
    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}