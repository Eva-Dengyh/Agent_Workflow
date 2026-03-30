'use client'

import { clsx } from 'clsx'
import { Task, TaskStatus } from '@/types'

interface ProgressBoardProps {
  task: Task | null
  compact?: boolean
}

const stages: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'pending', label: '待处理', color: 'bg-gray-400' },
  { key: 'planning', label: '规划中', color: 'bg-blue-500' },
  { key: 'coding', label: '开发中', color: 'bg-emerald-500' },
  { key: 'reviewing', label: '审查中', color: 'bg-amber-500' },
  { key: 'feedback', label: '反馈中', color: 'bg-orange-500' },
  { key: 'completed', label: '已完成', color: 'bg-green-500' }
]

const stageOrder: TaskStatus[] = ['pending', 'planning', 'coding', 'reviewing', 'feedback', 'completed']

export function ProgressBoard({ task, compact = false }: ProgressBoardProps) {
  if (!task) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        选择一个任务查看进度
      </div>
    )
  }
  
  const currentIndex = stageOrder.indexOf(task.status)
  
  return (
    <div className={clsx('rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4', compact ? 'p-2' : 'p-6')}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">任务进度</h3>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          {stageOrder.map((stage, index) => {
            const isActive = index <= currentIndex
            return (
              <div 
                key={stage}
                className={clsx(
                  'flex-1 transition-all duration-300',
                  stages[index].color,
                  isActive ? 'opacity-100' : 'opacity-20'
                )}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {stages.map((stage) => (
            <span 
              key={stage.key}
              className={clsx(
                task.status === stage.key && 'text-emerald-600 dark:text-emerald-400 font-medium'
              )}
            >
              {stage.label}
            </span>
          ))}
        </div>
      </div>
      
      {/* Current stage */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">当前阶段</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {stages[currentIndex]?.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">总体进度</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {task.progress}%
          </p>
        </div>
      </div>
      
      {/* Sub-tasks progress */}
      {task.plan?.subTasks && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">模块进度</h4>
          <div className="space-y-2">
            {task.plan.subTasks.map((subTask) => (
              <div key={subTask.module} className="flex items-center gap-3">
                <div className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center text-xs',
                  subTask.status === 'completed' ? 'bg-emerald-500 text-white' :
                  subTask.status === 'in_progress' ? 'bg-emerald-500/30 border-2 border-emerald-500' :
                  'bg-gray-200 dark:bg-gray-700'
                )}>
                  {subTask.status === 'completed' && '✓'}
                </div>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {subTask.module}
                </span>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${subTask.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {subTask.progress}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}