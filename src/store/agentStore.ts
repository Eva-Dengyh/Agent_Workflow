import { create } from 'zustand'
import { AgentStatus, AgentType } from '@/types'

interface AgentState {
  agents: Record<AgentType, AgentStatus>
  
  // Actions
  updateAgentStatus: (type: AgentType, updates: Partial<AgentStatus>) => void
  setAgentWorking: (type: AgentType, taskId: string) => void
  setAgentIdle: (type: AgentType) => void
  setAgentError: (type: AgentType) => void
}

const initialAgents: Record<AgentType, AgentStatus> = {
  planner: {
    id: 'planner_code_agent_bot',
    name: 'Planner',
    type: 'planner',
    status: 'idle',
    lastActive: new Date()
  },
  coder: {
    id: 'coder_code_agent_bot',
    name: 'Coder',
    type: 'coder',
    status: 'idle',
    lastActive: new Date()
  },
  reviewer: {
    id: 'reviewer_code_agent_bot',
    name: 'Reviewer',
    type: 'reviewer',
    status: 'idle',
    lastActive: new Date()
  }
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: initialAgents,
  
  updateAgentStatus: (type, updates) => set((state) => ({
    agents: {
      ...state.agents,
      [type]: { ...state.agents[type], ...updates }
    }
  })),
  
  setAgentWorking: (type, taskId) => set((state) => ({
    agents: {
      ...state.agents,
      [type]: { 
        ...state.agents[type], 
        status: 'working', 
        currentTask: taskId,
        lastActive: new Date()
      }
    }
  })),
  
  setAgentIdle: (type) => set((state) => ({
    agents: {
      ...state.agents,
      [type]: { 
        ...state.agents[type], 
        status: 'idle', 
        currentTask: undefined,
        lastActive: new Date()
      }
    }
  })),
  
  setAgentError: (type) => set((state) => ({
    agents: {
      ...state.agents,
      [type]: { 
        ...state.agents[type], 
        status: 'error',
        lastActive: new Date()
      }
    }
  }))
}))