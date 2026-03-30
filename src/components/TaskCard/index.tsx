'use client'

import { Task } from '@/types'
import { format } from 'date-fns'
import { clsx } from 'clsx'

interface TaskCardProps {
  task: Task
  isSelected?: boolean
  onClick?: () => void
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
}

const statusLabels = {
  pending: { text: '待处理', color: 'text-gray-500' },
  planning: { text: '规划中', color: 'text-blue-500' },
  coding: { text: '开发中', color: 'text-emerald-500' },
  reviewing: { text: '审查中', color: 'text-amber-500' },
  feedback: { text: '反馈中', color: 'text-orange-500' },
  completed: { text: '已完成', color: 'text-green-500' }
}

export function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  const statusInfo = statusLabels[task.status]
  
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-lg border cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-emerald-500',
        isSelected 
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={clsx('w-2 h-2 rounded-full', priorityColors[task.priority])} />
          <span className="text-sm font-mono text-gray-500">{task.id}</span>
        </div>
        <span className={clsx('text-xs font-medium px-2 py-1 rounded', statusInfo.color)}>
          {statusInfo.text}
        </span>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title || task.requirement.slice(0, 50)}
      </h3>
      
      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>进度</span>
          <span>{task.progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>更新于 {format(new Date(task.updatedAt), 'HH:mm')}</span>
        {task.currentModule && (
          <span className="text-emerald-600 dark:text-emerald-400">
            {task.currentModule}
          </span>
        )}
      </div>
    </div>
  )
}