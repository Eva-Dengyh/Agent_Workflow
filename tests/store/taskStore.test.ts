import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '@/store/taskStore'
import { Task, TaskStatus } from '@/types'

describe('TaskStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useTaskStore.getState()
    store.tasks.forEach(task => store.deleteTask(task.id))
    store.setCurrentTask(null)
    store.setFilter('all')
  })

  describe('addTask', () => {
    it('should add a task to the store', () => {
      const task: Task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().addTask(task)

      const tasks = useTaskStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0].id).toBe('TASK-001')
    })

    it('should add multiple tasks', () => {
      useTaskStore.getState().addTask(createMockTask('TASK-001', 'pending'))
      useTaskStore.getState().addTask(createMockTask('TASK-002', 'pending'))

      const tasks = useTaskStore.getState().tasks
      expect(tasks).toHaveLength(2)
    })
  })

  describe('updateTask', () => {
    it('should update task properties', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().addTask(task)

      useTaskStore.getState().updateTask('TASK-001', {
        title: 'Updated Title',
        progress: 50
      })

      const updated = useTaskStore.getState().tasks[0]
      expect(updated.title).toBe('Updated Title')
      expect(updated.progress).toBe(50)
    })

    it('should update currentTask if it matches', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().addTask(task)
      useTaskStore.getState().setCurrentTask(task)

      useTaskStore.getState().updateTask('TASK-001', { status: 'coding' })

      expect(useTaskStore.getState().currentTask?.status).toBe('coding')
    })
  })

  describe('setCurrentTask', () => {
    it('should set current task', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().setCurrentTask(task)

      expect(useTaskStore.getState().currentTask).toEqual(task)
    })

    it('should clear current task when set to null', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().setCurrentTask(task)
      useTaskStore.getState().setCurrentTask(null)

      expect(useTaskStore.getState().currentTask).toBeNull()
    })
  })

  describe('deleteTask', () => {
    it('should remove a task from the store', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().addTask(task)
      useTaskStore.getState().deleteTask('TASK-001')

      const tasks = useTaskStore.getState().tasks
      expect(tasks).toHaveLength(0)
    })

    it('should clear currentTask if deleted task was current', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().addTask(task)
      useTaskStore.getState().setCurrentTask(task)
      useTaskStore.getState().deleteTask('TASK-001')

      expect(useTaskStore.getState().currentTask).toBeNull()
    })
  })

  describe('setFilter', () => {
    it('should update filter state', () => {
      useTaskStore.getState().setFilter('active')
      expect(useTaskStore.getState().filter).toBe('active')
    })
  })

  describe('addLog', () => {
    it('should add a log entry to a task', () => {
      const task = createMockTask('TASK-001', 'coding')
      useTaskStore.getState().addTask(task)

      const log = {
        timestamp: new Date(),
        level: 'info' as const,
        message: 'Test log entry',
        source: 'coder' as const
      }
      useTaskStore.getState().addLog('TASK-001', log)

      const updated = useTaskStore.getState().tasks[0]
      expect(updated.logs).toHaveLength(1)
      expect(updated.logs[0].message).toBe('Test log entry')
    })
  })

  describe('updateProgress', () => {
    it('should update task progress', () => {
      const task = createMockTask('TASK-001', 'coding')
      useTaskStore.getState().addTask(task)

      useTaskStore.getState().updateProgress('TASK-001', 75, 'Module A')

      const updated = useTaskStore.getState().tasks[0]
      expect(updated.progress).toBe(75)
      expect(updated.currentModule).toBe('Module A')
    })
  })

  describe('setTaskStatus', () => {
    it('should update task status', () => {
      const task = createMockTask('TASK-001', 'pending')
      useTaskStore.getState().addTask(task)

      useTaskStore.getState().setTaskStatus('TASK-001', 'coding')

      const updated = useTaskStore.getState().tasks[0]
      expect(updated.status).toBe('coding')
    })
  })
})

// Helper function
function createMockTask(id: string, status: TaskStatus): Task {
  return {
    id,
    title: `Task ${id}`,
    status,
    priority: 'medium',
    requirement: 'Mock requirement',
    progress: 0,
    currentModule: '',
    logs: [],
    reviewIssues: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
}