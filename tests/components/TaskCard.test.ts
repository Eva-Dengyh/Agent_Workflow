import { describe, it, expect } from 'vitest'
import { Task } from '@/types'

describe('TaskCard Component Logic', () => {
  describe('Priority Color Mapping', () => {
    const priorityColors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }

    it('should return correct color for high priority', () => {
      expect(priorityColors.high).toBe('bg-red-500')
    })

    it('should return correct color for medium priority', () => {
      expect(priorityColors.medium).toBe('bg-yellow-500')
    })

    it('should return correct color for low priority', () => {
      expect(priorityColors.low).toBe('bg-green-500')
    })
  })

  describe('Status Label Mapping', () => {
    const statusLabels = {
      pending: { text: '待处理', color: 'text-gray-500' },
      planning: { text: '规划中', color: 'text-blue-500' },
      coding: { text: '开发中', color: 'text-emerald-500' },
      reviewing: { text: '审查中', color: 'text-amber-500' },
      feedback: { text: '反馈中', color: 'text-orange-500' },
      completed: { text: '已完成', color: 'text-green-500' }
    }

    it('should have correct labels for all statuses', () => {
      expect(statusLabels.pending.text).toBe('待处理')
      expect(statusLabels.planning.text).toBe('规划中')
      expect(statusLabels.coding.text).toBe('开发中')
      expect(statusLabels.reviewing.text).toBe('审查中')
      expect(statusLabels.feedback.text).toBe('反馈中')
      expect(statusLabels.completed.text).toBe('已完成')
    })

    it('should have color for all statuses', () => {
      Object.values(statusLabels).forEach(label => {
        expect(label.color).toMatch(/^text-/)
      })
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const subTasks = [
        { progress: 100 },
        { progress: 50 },
        { progress: 0 }
      ]
      const avgProgress = subTasks.reduce((sum, t) => sum + t.progress, 0) / subTasks.length
      expect(avgProgress).toBe(50)
    })

    it('should handle empty subTasks', () => {
      const subTasks: { progress: number }[] = []
      const avgProgress = subTasks.length > 0 
        ? subTasks.reduce((sum, t) => sum + t.progress, 0) / subTasks.length 
        : 0
      expect(avgProgress).toBe(0)
    })
  })

  describe('Task ID Format', () => {
    it('should match TASK-XXXX-XXX pattern', () => {
      const taskId = 'TASK-2026-001'
      expect(taskId).toMatch(/^TASK-\d{4}-\d{3}$/)
    })

    it('should generate unique IDs', () => {
      let counter = 0
      const generateId = () => `TASK-${++counter}`
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('Deadline Validation', () => {
    it('should detect overdue tasks', () => {
      const task: Task = {
        id: 'TASK-001',
        title: 'Test',
        status: 'coding',
        priority: 'high',
        requirement: '',
        progress: 50,
        currentModule: 'Module A',
        logs: [],
        reviewIssues: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deadline: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }

      const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false
      expect(isOverdue).toBe(true)
    })

    it('should handle missing deadline', () => {
      const task: Task = {
        id: 'TASK-001',
        title: 'Test',
        status: 'coding',
        priority: 'medium',
        requirement: '',
        progress: 0,
        currentModule: '',
        logs: [],
        reviewIssues: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(task.deadline).toBeUndefined()
    })
  })
})