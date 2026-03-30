// Task types
export type TaskStatus = 'pending' | 'planning' | 'coding' | 'reviewing' | 'feedback' | 'completed'

export interface SubTask {
  module: string
  description: string
  order: number
  files: string[]
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
}

export interface Plan {
  subTasks: SubTask[]
  techStack: string[]
  estimatedTime: string
}

export interface Log {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  source?: 'planner' | 'coder' | 'reviewer' | 'system'
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: 'high' | 'medium' | 'low'
  requirement: string
  plan?: Plan
  progress: number
  currentModule: string
  logs: Log[]
  reviewIssues: ReviewIssue[]
  createdAt: Date
  updatedAt: Date
  deadline?: string
}

// Agent types
export type AgentType = 'planner' | 'coder' | 'reviewer'

export interface AgentStatus {
  id: string
  name: string
  type: AgentType
  status: 'idle' | 'working' | 'error'
  currentTask?: string
  lastActive: Date
}

export type MessageType = 'new_task' | 'progress_update' | 'submit_review' | 'review_feedback' | 'task_completed' | 'chat'

export interface AgentMessage {
  id: string
  taskId?: string
  agentType: AgentType
  type: MessageType
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Review types
export type IssueSeverity = 'error' | 'warning' | 'info'

export interface ReviewIssue {
  id: string
  severity: IssueSeverity
  location: string
  description: string
  suggestion: string
  referenceCode?: string
  fixed: boolean
  fixedAt?: Date
}

export interface ReviewReport {
  taskId: string
  passed: boolean
  issues: ReviewIssue[]
  summary: string
  reviewedAt: Date
}

// SSE Event types
export type SSEEventType = 'task_update' | 'agent_status' | 'log' | 'notification' | 'review_feedback'

export interface SSEEvent {
  type: SSEEventType
  data: unknown
  timestamp: Date
}

// File types
export interface ProjectFile {
  path: string
  name: string
  type: 'file' | 'directory'
  status?: 'completed' | 'in_progress' | 'pending'
  children?: ProjectFile[]
  content?: string
}