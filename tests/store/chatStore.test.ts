import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '@/store/chatStore'
import { AgentMessage } from '@/types'

describe('ChatStore', () => {
  beforeEach(() => {
    const store = useChatStore.getState()
    // Clear all conversations
    Object.keys(store.conversations).forEach(key => {
      store.clearConversation(key)
    })
    store.setActiveAgent('planner')
    store.clearUnread()
  })

  describe('initial state', () => {
    it('should have empty conversations', () => {
      expect(useChatStore.getState().conversations).toEqual({})
    })

    it('should default to planner as active agent', () => {
      expect(useChatStore.getState().activeAgent).toBe('planner')
    })

    it('should have zero unread count', () => {
      expect(useChatStore.getState().unreadCount).toBe(0)
    })
  })

  describe('addMessage', () => {
    it('should add a message to a conversation', () => {
      const message = createMockMessage('msg-001', 'planner', 'Hello')

      useChatStore.getState().addMessage('general', message)

      const { conversations } = useChatStore.getState()
      expect(conversations['general']).toHaveLength(1)
      expect(conversations['general'][0].content).toBe('Hello')
    })

    it('should append to existing conversation', () => {
      const msg1 = createMockMessage('msg-001', 'planner', 'First')
      const msg2 = createMockMessage('msg-002', 'coder', 'Second')

      useChatStore.getState().addMessage('task-1', msg1)
      useChatStore.getState().addMessage('task-1', msg2)

      const { conversations } = useChatStore.getState()
      expect(conversations['task-1']).toHaveLength(2)
    })

    it('should create new conversation for new key', () => {
      const message = createMockMessage('msg-001', 'planner', 'New conversation')

      useChatStore.getState().addMessage('new-key', message)

      const { conversations } = useChatStore.getState()
      expect(conversations['new-key']).toHaveLength(1)
    })
  })

  describe('setActiveAgent', () => {
    it('should update active agent', () => {
      useChatStore.getState().setActiveAgent('coder')
      expect(useChatStore.getState().activeAgent).toBe('coder')

      useChatStore.getState().setActiveAgent('reviewer')
      expect(useChatStore.getState().activeAgent).toBe('reviewer')
    })
  })

  describe('clearConversation', () => {
    it('should remove all messages from a conversation', () => {
      const message = createMockMessage('msg-001', 'planner', 'To be cleared')
      useChatStore.getState().addMessage('temp', message)

      useChatStore.getState().clearConversation('temp')

      const { conversations } = useChatStore.getState()
      expect(conversations['temp']).toHaveLength(0)
    })
  })

  describe('unread count', () => {
    it('should increment unread count', () => {
      useChatStore.getState().incrementUnread()
      expect(useChatStore.getState().unreadCount).toBe(1)

      useChatStore.getState().incrementUnread()
      expect(useChatStore.getState().unreadCount).toBe(2)
    })

    it('should clear unread count', () => {
      useChatStore.getState().incrementUnread()
      useChatStore.getState().incrementUnread()
      useChatStore.getState().clearUnread()

      expect(useChatStore.getState().unreadCount).toBe(0)
    })
  })
})

function createMockMessage(
  id: string,
  agentType: 'planner' | 'coder' | 'reviewer',
  content: string
): AgentMessage {
  return {
    id,
    agentType,
    type: 'chat',
    content,
    timestamp: new Date()
  }
}