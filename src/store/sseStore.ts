import { create } from 'zustand'
import { SSEEvent } from '@/types'

interface SSEState {
  connected: boolean
  events: SSEEvent[]
  reconnectAttempts: number
  maxReconnectAttempts: number
  
  // Actions
  setConnected: (connected: boolean) => void
  addEvent: (event: SSEEvent) => void
  clearEvents: () => void
  incrementReconnect: () => void
  resetReconnect: () => void
}

export const useSSEStore = create<SSEState>((set) => ({
  connected: false,
  events: [],
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  
  setConnected: (connected) => set({ connected }),
  
  addEvent: (event) => set((state) => ({
    events: [...state.events.slice(-99), event]
  })),
  
  clearEvents: () => set({ events: [] }),
  
  incrementReconnect: () => set((state) => ({
    reconnectAttempts: state.reconnectAttempts + 1
  })),
  
  resetReconnect: () => set({ reconnectAttempts: 0 })
}))