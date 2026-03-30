'use client'

import { useState, useEffect } from 'react'
import { useTaskStore } from '@/store/taskStore'
import { useAgentStore } from '@/store/agentStore'
import { useSSEStore } from '@/store/sseStore'
import { Task, TaskStatus, Log, AgentMessage, ReviewIssue, ProjectFile } from '@/types'
import { 
  TaskCard, 
  ProgressBoard, 
  CodeEditor, 
  ReviewFeedback, 
  DevLog, 
  FileTree, 
  AgentChat,
  NotificationCenter
} from '@/components'
import type { Notification } from '@/components/NotificationCenter'
import { clsx } from 'clsx'
import { useOpenClaw } from '@/lib/useOpenClaw'

export default function DashboardPage() {
  const { tasks, currentTask, setCurrentTask, filter, setFilter, addLog, updateProgress } = useTaskStore()
  const { agents } = useAgentStore()
  const { connected, setConnected } = useSSEStore()
  
  // Local state for demo
  const [logs, setLogs] = useState<Log[]>([])
  const [messages, setMessages] = useState<Record<string, AgentMessage[]>>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'review'>('chat')
  
  // New task creation state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskRequirement, setNewTaskRequirement] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  
  // OpenClaw integration
  const { sendMessage } = useOpenClaw({ autoConnect: false })
  
  // Mock data for demo - use ref to prevent duplicate additions
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (isInitialized) return
    
    const demoTask: Task = {
      id: 'TASK-2026-001',
      title: '用户认证模块开发',
      status: 'coding',
      priority: 'high',
      requirement: '实现基于 JWT 的用户认证系统，包括登录、注册、Token 刷新功能',
      progress: 65,
      currentModule: 'JWT Token 生成',
      logs: [
        { timestamp: new Date(Date.now() - 3600000), level: 'info', message: '开始处理任务 TASK-2026-001', source: 'coder' },
        { timestamp: new Date(Date.now() - 3000000), level: 'success', message: '完成用户模型定义', source: 'coder' },
        { timestamp: new Date(Date.now() - 2400000), level: 'info', message: '实现 Token 生成逻辑', source: 'coder' },
        { timestamp: new Date(Date.now() - 1800000), level: 'success', message: '完成 Token 验证中间件', source: 'coder' },
      ],
      reviewIssues: [
        {
          id: 'issue-1',
          severity: 'warning',
          location: 'src/lib/auth.ts:45',
          description: 'Token 过期时间建议使用环境变量配置',
          suggestion: '将硬编码的过期时间改为从 process.env.TOKEN_EXPIRY 读取',
          referenceCode: 'const expiry = process.env.TOKEN_EXPIRY || "7d"',
          fixed: false
        }
      ],
      plan: {
        subTasks: [
          { module: '数据模型', description: '定义用户 Schema', order: 1, files: ['src/models/user.ts'], status: 'completed', progress: 100 },
          { module: 'JWT 工具', description: '实现 Token 生成验证', order: 2, files: ['src/lib/auth.ts'], status: 'in_progress', progress: 75 },
          { module: 'API 路由', description: '登录注册接口', order: 3, files: ['src/app/api/auth/login/route.ts'], status: 'pending', progress: 0 },
          { module: '单元测试', description: '编写测试用例', order: 4, files: ['tests/auth.test.ts'], status: 'pending', progress: 0 }
        ],
        techStack: ['Next.js', 'TypeScript', 'Prisma', 'JWT'],
        estimatedTime: '4 小时'
      },
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 1800000),
      deadline: new Date(Date.now() + 86400000).toISOString()
    }
    
    // Check if task already exists
    const existingTasks = useTaskStore.getState().tasks
    const taskExists = existingTasks.some(t => t.id === demoTask.id)
    
    if (!taskExists) {
      useTaskStore.getState().addTask(demoTask)
      useTaskStore.getState().setCurrentTask(demoTask)
      setIsInitialized(true)
    } else if (!useTaskStore.getState().currentTask) {
      useTaskStore.getState().setCurrentTask(demoTask)
      setIsInitialized(true)
    } else {
      setIsInitialized(true)
    }
  }, [isInitialized])
  
  // SSE connection - actual EventSource connection
  useEffect(() => {
    let eventSource: EventSource | null = null
    
    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events')
        
        eventSource.onopen = () => {
          setConnected(true)
        }
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            // Handle SSE events here
            if (data.type === 'agent_status') {
              // Update agent statuses from SSE
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        eventSource.onerror = () => {
          setConnected(false)
          // Close and reconnect after delay
          eventSource?.close()
          setTimeout(connectSSE, 5000)
        }
      } catch (e) {
        setConnected(false)
      }
    }
    
    connectSSE()
    
    return () => {
      eventSource?.close()
      setConnected(false)
    }
  }, [setConnected])
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return task.status !== 'completed'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })
  
  // Handle send message - real OpenClaw integration
  const handleSendMessage = async (content: string) => {
    if (!currentTask) return
    
    setIsLoading(true)
    
    // Add user message
    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      agentType: 'planner',
      type: 'chat',
      content,
      timestamp: new Date()
    }
    
    setMessages(prev => ({
      ...prev,
      [currentTask.id]: [...(prev[currentTask.id] || []), userMsg]
    }))
    
    // Send to OpenClaw Agent
    try {
      const result = await fetch('/api/openclaw/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'planner',
          taskId: currentTask.id,
          content,
          type: 'chat'
        })
      })
      
      const data = await result.json()
      
      // Add agent response if available
      if (data.success && data.data) {
        const agentMsg: AgentMessage = {
          id: (Date.now() + 1).toString(),
          agentType: 'planner',
          type: 'chat',
          content: typeof data.data === 'string' ? data.data : JSON.stringify(data.data),
          timestamp: new Date()
        }
        
        setMessages(prev => ({
          ...prev,
          [currentTask.id]: [...(prev[currentTask.id] || []), agentMsg]
        }))
      } else {
        // Add error message
        const errorMsg: AgentMessage = {
          id: (Date.now() + 1).toString(),
          agentType: 'planner',
          type: 'chat',
          content: `⚠️ 发送失败: ${data.error || '未知错误'}。请确保 OpenClaw Gateway 正在运行。`,
          timestamp: new Date()
        }
        setMessages(prev => ({
          ...prev,
          [currentTask.id]: [...(prev[currentTask.id] || []), errorMsg]
        }))
      }
    } catch (error) {
      // Add error message
      const errorMsg: AgentMessage = {
        id: (Date.now() + 1).toString(),
        agentType: 'planner',
        type: 'chat',
        content: `⚠️ 网络错误: ${error instanceof Error ? error.message : '无法连接到服务器'}`,
        timestamp: new Date()
      }
      setMessages(prev => ({
        ...prev,
        [currentTask.id]: [...(prev[currentTask.id] || []), errorMsg]
      }))
    }
    
    setIsLoading(false)
  }
  
  // Handle create new task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskRequirement.trim()) return
    
    setIsCreatingTask(true)
    
    try {
      const result = await fetch('/api/openclaw/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: newTaskTitle,
          requirement: newTaskRequirement
        })
      })
      
      const data = await result.json()
      
      if (data.success) {
        // Create local task
        const newTask: Task = {
          id: data.data?.taskId || `TASK-${Date.now()}`,
          title: newTaskTitle,
          status: 'planning',
          priority: 'medium',
          requirement: newTaskRequirement,
          progress: 0,
          currentModule: '等待 Planner 分析',
          logs: [{
            timestamp: new Date(),
            level: 'info',
            message: '任务已创建，等待 Planner 分析',
            source: 'system'
          }],
          reviewIssues: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        useTaskStore.getState().addTask(newTask)
        setCurrentTask(newTask)
        
        // Reset form
        setShowCreateModal(false)
        setNewTaskTitle('')
        setNewTaskRequirement('')
        
        // Add notification
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          title: '任务已创建',
          message: `任务 "${newTaskTitle}" 已发送给 Planner`,
          timestamp: new Date(),
          read: false
        }])
      } else {
        // Use in-app notification instead of browser alert
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          title: '创建失败',
          message: data.error || '请检查 OpenClaw Gateway 连接',
          timestamp: new Date(),
          read: false
        }])
      }
    } catch (error) {
      // Use in-app notification instead of browser alert
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        title: '创建失败',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date(),
        read: false
      }])
    }
    
    setIsCreatingTask(false)
  }
  
  // Handle mark notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }
  
  // Mock file tree
  const mockFiles: ProjectFile[] = [
    {
      type: 'directory',
      name: 'src',
      path: 'src',
      status: 'in_progress',
      children: [
        { type: 'directory', name: 'app', path: 'src/app', status: 'in_progress', children: [
          { type: 'directory', name: 'api', path: 'src/app/api', status: 'in_progress', children: [
            { type: 'file', name: 'auth.ts', status: 'in_progress', path: 'src/app/api/auth.ts' },
            { type: 'file', name: 'tasks.ts', status: 'pending', path: 'src/app/api/tasks.ts' }
          ]},
          { type: 'file', name: 'page.tsx', status: 'completed', path: 'src/app/page.tsx' }
        ]},
        { type: 'directory', name: 'lib', path: 'src/lib', status: 'in_progress', children: [
          { type: 'file', name: 'auth.ts', status: 'in_progress', path: 'src/lib/auth.ts' },
          { type: 'file', name: 'types.ts', status: 'completed', path: 'src/lib/types.ts' }
        ]}
      ]
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🤖 Multi-Agent 开发平台
            </h1>
            <div className={clsx(
              'flex items-center gap-1 text-xs px-2 py-1 rounded',
              connected 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {connected ? '已连接' : '未连接'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAll={() => setNotifications([])}
            />
            
            {/* Agent status */}
            <div className="flex items-center gap-2">
              {Object.values(agents).map(agent => (
                <div 
                  key={agent.type}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs',
                    agent.status === 'idle' && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                    agent.status === 'working' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    agent.status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {agent.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left sidebar - Task list */}
        <aside className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-4">
            {/* Create Task button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full mb-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <span className="text-lg">+</span>
              新建任务
            </button>
            
            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-3 py-1.5 rounded text-sm transition-colors',
                    filter === f 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
                </button>
              ))}
            </div>
            
            {/* Task list */}
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  isSelected={currentTask?.id === task.id}
                  onClick={() => setCurrentTask(task)}
                />
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-4xl mb-2">📋</p>
                  <p>暂无任务</p>
                </div>
              )}
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTask ? (
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Progress board */}
              <div className="mb-6">
                <ProgressBoard task={currentTask} />
              </div>
              
              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                {[
                  { key: 'chat', label: '💬 Agent 对话', count: messages[currentTask.id]?.length || 0 },
                  { key: 'code', label: '📁 文件结构', count: 0 },
                  { key: 'review', label: '🔍 审查反馈', count: currentTask.reviewIssues.filter(i => !i.fixed).length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={clsx(
                      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.key
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Tab content */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  {activeTab === 'chat' && (
                    <AgentChat
                      agentType="planner"
                      agentName="Planner"
                      messages={messages[currentTask.id] || []}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                    />
                  )}
                  
                  {activeTab === 'code' && (
                    <FileTree 
                      files={mockFiles}
                      onFileClick={(file) => setSelectedFile(file)}
                      selectedPath={selectedFile?.path}
                    />
                  )}
                  
                  {activeTab === 'review' && (
                    <ReviewFeedback
                      issues={currentTask.reviewIssues}
                      passed={currentTask.reviewIssues.length === 0 || currentTask.reviewIssues.every(i => i.fixed)}
                      summary={currentTask.reviewIssues.length > 0 ? `发现 ${currentTask.reviewIssues.filter(i => !i.fixed).length} 个问题需要修复` : undefined}
                      onFixIssue={(id) => {
                        useTaskStore.getState().updateTask(currentTask.id, {
                          reviewIssues: currentTask.reviewIssues.map(i => 
                            i.id === id ? { ...i, fixed: true, fixedAt: new Date() } : i
                          )
                        })
                      }}
                      onResubmit={() => {
                        useTaskStore.getState().setTaskStatus(currentTask.id, 'reviewing')
                      }}
                    />
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Code editor */}
                  {selectedFile && (
                    <CodeEditor
                      initialValue={`// ${selectedFile.name}\n// File: ${selectedFile.path}\n\n`}
                      language="typescript"
                      readOnly
                    />
                  )}
                  
                  {/* Dev log */}
                  <DevLog 
                    logs={[...currentTask.logs, ...logs]}
                    maxHeight="h-64"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-6xl mb-4">👈</p>
                <p className="text-lg">从左侧选择一个任务开始</p>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">创建新任务</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  任务名称
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="例如：用户登录功能"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  需求描述
                </label>
                <textarea
                  value={newTaskRequirement}
                  onChange={(e) => setNewTaskRequirement(e.target.value)}
                  placeholder="详细描述你的需求..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || !newTaskRequirement.trim() || isCreatingTask}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingTask ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}