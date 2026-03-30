import { describe, it, expect, beforeEach } from 'vitest'
import { useSSEStore } from '@/store/sseStore'
import { SSEEvent } from '@/types'

describe('SSEStore', () => {
  beforeEach(() => {
    const store = useSSEStore.getState()
    store.clearEvents()
    store.setConnected(false)
    store.resetReconnect()
  })

  describe('initial state', () => {
    it('should start disconnected', () => {
      expect(useSSEStore.getState().connected).toBe(false)
    })

    it('should have empty events array', () => {
      expect(useSSEStore.getState().events).toEqual([])
    })

    it('should have zero reconnect attempts', () => {
      expect(useSSEStore.getState().reconnectAttempts).toBe(0)
    })
  })

  describe('setConnected', () => {
    it('should update connection status', () => {
      useSSEStore.getState().setConnected(true)
      expect(useSSEStore.getState().connected).toBe(true)

      useSSEStore.getState().setConnected(false)
      expect(useSSEStore.getState().connected).toBe(false)
    })
  })

  describe('addEvent', () => {
    it('should add an event to the events array', () => {
      const event: SSEEvent = {
        type: 'task_update',
        data: { taskId: 'TASK-001' },
        timestamp: new Date()
      }

      useSSEStore.getState().addEvent(event)

      const { events } = useSSEStore.getState()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('task_update')
    })

    it('should limit events to 100 most recent', () => {
      // Add 105 events
      for (let i = 0; i < 105; i++) {
        useSSEStore.getState().addEvent({
          type: 'notification',
          data: { index: i },
          timestamp: new Date()
        })
      }

      const { events } = useSSEStore.getState()
      expect(events).toHaveLength(100)
      // Should keep the most recent 100
      expect(events[0].data).toEqual({ index: 5 })
    })
  })

  describe('clearEvents', () => {
    it('should clear all events', () => {
      useSSEStore.getState().addEvent({
        type: 'notification',
        data: {},
        timestamp: new Date()
      })

      useSSEStore.getState().clearEvents()

      expect(useSSEStore.getState().events).toHaveLength(0)
    })
  })

  describe('reconnect handling', () => {
    it('should increment reconnect attempts', () => {
      useSSEStore.getState().incrementReconnect()
      expect(useSSEStore.getState().reconnectAttempts).toBe(1)

      useSSEStore.getState().incrementReconnect()
      expect(useSSEStore.getState().reconnectAttempts).toBe(2)
    })

    it('should reset reconnect attempts', () => {
      useSSEStore.getState().incrementReconnect()
      useSSEStore.getState().incrementReconnect()
      useSSEStore.getState().resetReconnect()

      expect(useSSEStore.getState().reconnectAttempts).toBe(0)
    })

    it('should have maxReconnectAttempts set', () => {
      expect(useSSEStore.getState().maxReconnectAttempts).toBe(5)
    })
  })
})