import { describe, it, expect } from 'vitest'
import { Task, TaskStatus, ReviewIssue, AgentMessage, AgentType } from '@/types'

describe('Type Definitions', () => {
  describe('Task', () => {
    it('should allow creating a valid task', () => {
      const task: Task = {
        id: 'TASK-001',
        title: 'Test Task',
        status: 'pending',
        priority: 'high',
        requirement: 'Test requirement',
        progress: 0,
        currentModule: '',
        logs: [],
        reviewIssues: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(task.id).toBe('TASK-001')
      expect(task.status).toBe('pending')
    })

    it('should support all task statuses', () => {
      const statuses: TaskStatus[] = [
        'pending', 'planning', 'coding', 'reviewing', 'feedback', 'completed'
      ]

      statuses.forEach(status => {
        const task: Task = createTaskWithStatus(status)
        expect(task.status).toBe(status)
      })
    })

    it('should allow optional deadline', () => {
      const task: Task = {
        id: 'TASK-001',
        title: 'Test',
        status: 'pending',
        priority: 'medium',
        requirement: '',
        progress: 0,
        currentModule: '',
        logs: [],
        reviewIssues: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deadline: new Date().toISOString()
      }

      expect(task.deadline).toBeDefined()
    })

    it('should allow plan with subtasks', () => {
      const task: Task = {
        id: 'TASK-001',
        title: 'Test',
        status: 'coding',
        priority: 'high',
        requirement: '',
        progress: 50,
        currentModule: 'Module 1',
        logs: [],
        reviewIssues: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: {
          subTasks: [
            { module: 'M1', description: 'D1', order: 1, files: ['f1.ts'], status: 'completed', progress: 100 },
            { module: 'M2', description: 'D2', order: 2, files: ['f2.ts'], status: 'in_progress', progress: 50 }
          ],
          techStack: ['Next.js', 'TypeScript'],
          estimatedTime: '4h'
        }
      }

      expect(task.plan?.subTasks).toHaveLength(2)
      expect(task.plan?.techStack).toContain('Next.js')
    })
  })

  describe('ReviewIssue', () => {
    it('should allow creating review issues', () => {
      const issue: ReviewIssue = {
        id: 'issue-001',
        severity: 'error',
        location: 'src/index.ts:10',
        description: 'Missing type annotation',
        suggestion: 'Add type annotation',
        fixed: false
      }

      expect(issue.severity).toBe('error')
      expect(issue.fixed).toBe(false)
    })

    it('should support fixed status', () => {
      const issue: ReviewIssue = {
        id: 'issue-001',
        severity: 'warning',
        location: 'test.ts:5',
        description: 'Warning',
        suggestion: 'Fix it',
        fixed: true,
        fixedAt: new Date()
      }

      expect(issue.fixed).toBe(true)
      expect(issue.fixedAt).toBeDefined()
    })
  })

  describe('AgentMessage', () => {
    it('should allow creating agent messages', () => {
      const message: AgentMessage = {
        id: 'msg-001',
        agentType: 'planner',
        type: 'chat',
        content: 'Hello',
        timestamp: new Date()
      }

      expect(message.agentType).toBe('planner')
      expect(message.type).toBe('chat')
    })

    it('should support message types', () => {
      const types: AgentMessage['type'][] = [
        'new_task', 'progress_update', 'submit_review', 'review_feedback', 'task_completed', 'chat'
      ]

      types.forEach(type => {
        const message: AgentMessage = createMessageWithType(type)
        expect(message.type).toBe(type)
      })
    })
  })

  describe('SSEEvent', () => {
    it('should support all SSE event types', () => {
      const types = ['task_update', 'agent_status', 'log', 'notification', 'review_feedback']

      types.forEach(type => {
        const event = {
          type,
          data: {},
          timestamp: new Date()
        }
        expect(event.type).toBe(type)
      })
    })
  })
})

// Helper functions
function createTaskWithStatus(status: TaskStatus): Task {
  return {
    id: `TASK-${status}`,
    title: 'Test',
    status,
    priority: 'medium',
    requirement: '',
    progress: 0,
    currentModule: '',
    logs: [],
    reviewIssues: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function createMessageWithType(type: AgentMessage['type']): AgentMessage {
  return {
    id: 'msg-001',
    agentType: 'planner' as AgentType,
    type,
    content: 'Test',
    timestamp: new Date()
  }
}