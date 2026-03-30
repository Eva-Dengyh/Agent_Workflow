import { describe, it, expect, beforeEach } from 'vitest'
import { useAgentStore } from '@/store/agentStore'
import { AgentType } from '@/types'

describe('AgentStore', () => {
  beforeEach(() => {
    // Reset to initial state
    const store = useAgentStore.getState()
    store.updateAgentStatus('planner', { status: 'idle', lastActive: new Date() })
    store.updateAgentStatus('coder', { status: 'idle', lastActive: new Date() })
    store.updateAgentStatus('reviewer', { status: 'idle', lastActive: new Date() })
  })

  describe('initial state', () => {
    it('should have three agents initialized', () => {
      const { agents } = useAgentStore.getState()
      expect(agents).toHaveProperty('planner')
      expect(agents).toHaveProperty('coder')
      expect(agents).toHaveProperty('reviewer')
    })

    it('should have correct agent types', () => {
      const { agents } = useAgentStore.getState()
      expect(agents.planner.type).toBe('planner')
      expect(agents.coder.type).toBe('coder')
      expect(agents.reviewer.type).toBe('reviewer')
    })
  })

  describe('updateAgentStatus', () => {
    it('should update agent status properties', () => {
      useAgentStore.getState().updateAgentStatus('planner', {
        status: 'working',
        currentTask: 'TASK-001'
      })

      const { agents } = useAgentStore.getState()
      expect(agents.planner.status).toBe('working')
      expect(agents.planner.currentTask).toBe('TASK-001')
    })
  })

  describe('setAgentWorking', () => {
    it('should set agent to working state with task', () => {
      useAgentStore.getState().setAgentWorking('coder', 'TASK-002')

      const { agents } = useAgentStore.getState()
      expect(agents.coder.status).toBe('working')
      expect(agents.coder.currentTask).toBe('TASK-002')
    })

    it('should update lastActive timestamp', () => {
      const before = new Date()
      useAgentStore.getState().setAgentWorking('reviewer', 'TASK-003')
      const after = new Date()

      const { agents } = useAgentStore.getState()
      expect(agents.reviewer.lastActive.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(agents.reviewer.lastActive.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('setAgentIdle', () => {
    it('should set agent to idle state and clear currentTask', () => {
      // First set to working
      useAgentStore.getState().setAgentWorking('coder', 'TASK-002')
      // Then set to idle
      useAgentStore.getState().setAgentIdle('coder')

      const { agents } = useAgentStore.getState()
      expect(agents.coder.status).toBe('idle')
      expect(agents.coder.currentTask).toBeUndefined()
    })
  })

  describe('setAgentError', () => {
    it('should set agent to error state', () => {
      useAgentStore.getState().setAgentError('reviewer')

      const { agents } = useAgentStore.getState()
      expect(agents.reviewer.status).toBe('error')
    })
  })
})