import { create } from 'zustand'
import { Task, TaskStatus } from '@/types'

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  filter: 'all' | 'active' | 'completed'
  
  // Actions
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  setCurrentTask: (task: Task | null) => void
  deleteTask: (id: string) => void
  setFilter: (filter: 'all' | 'active' | 'completed') => void
  addLog: (taskId: string, log: Task['logs'][0]) => void
  updateProgress: (taskId: string, progress: number, module?: string) => void
  setTaskStatus: (taskId: string, status: TaskStatus) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTask: null,
  filter: 'all',
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => 
      t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
    ),
    currentTask: state.currentTask?.id === id 
      ? { ...state.currentTask, ...updates, updatedAt: new Date() }
      : state.currentTask
  })),
  
  setCurrentTask: (task) => set({ currentTask: task }),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id),
    currentTask: state.currentTask?.id === id ? null : state.currentTask
  })),
  
  setFilter: (filter) => set({ filter }),
  
  addLog: (taskId, log) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId 
        ? { ...t, logs: [...t.logs, log], updatedAt: new Date() }
        : t
    )
  })),
  
  updateProgress: (taskId, progress, module) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId 
        ? { ...t, progress, currentModule: module || t.currentModule, updatedAt: new Date() }
        : t
    )
  })),
  
  setTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, status, updatedAt: new Date() } : t
    )
  ))
}))