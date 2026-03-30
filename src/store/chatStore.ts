import { create } from 'zustand'
import { AgentMessage, AgentType } from '@/types'

interface ChatState {
  conversations: Record<string, AgentMessage[]> // key: taskId or 'general'
  activeAgent: AgentType
  unreadCount: number
  
  // Actions
  addMessage: (key: string, message: AgentMessage) => void
  setActiveAgent: (agent: AgentType) => void
  clearConversation: (key: string) => void
  incrementUnread: () => void
  clearUnread: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: {},
  activeAgent: 'planner',
  unreadCount: 0,
  
  addMessage: (key, message) => set((state) => ({
    conversations: {
      ...state.conversations,
      [key]: [...(state.conversations[key] || []), message]
    }
  })),
  
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  
  clearConversation: (key) => set((state) => ({
    conversations: {
      ...state.conversations,
      [key]: []
    }
  })),
  
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  
  clearUnread: () => set({ unreadCount: 0 })
}))