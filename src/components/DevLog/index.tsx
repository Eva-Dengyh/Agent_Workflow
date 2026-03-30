'use client'

import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { Log } from '@/types'
import { format } from 'date-fns'

interface DevLogProps {
  logs: Log[]
  autoScroll?: boolean
  maxHeight?: string
}

const levelConfig = {
  info: { icon: 'ℹ️', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  warn: { icon: '⚠️', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  error: { icon: '❌', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  success: { icon: '✅', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' }
}

const sourceColors = {
  planner: 'text-blue-500',
  coder: 'text-emerald-500',
  reviewer: 'text-amber-500',
  system: 'text-gray-500'
}

export function DevLog({ logs, autoScroll = true, maxHeight = 'h-96' }: DevLogProps) {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (autoScroll && !isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, autoScroll, isPaused])
  
  const handleExport = () => {
    const content = logs.map(log => {
      const time = format(new Date(log.timestamp), 'HH:mm:ss')
      const source = log.source ? `[${log.source.toUpperCase()}]` : ''
      return `[${time}] ${source} ${log.message}`
    }).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devlog-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className={clsx(
      'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden',
      maxHeight
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">开发日志</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={clsx(
              'px-2 py-1 text-xs rounded transition-colors',
              isPaused 
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            )}
          >
            {isPaused ? '▶ 继续' : '⏸ 暂停'}
          </button>
          <button
            onClick={handleExport}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            导出
          </button>
        </div>
      </div>
      
      {/* Log list */}
      <div 
        ref={containerRef}
        className="p-3 space-y-1 overflow-y-auto font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            暂无日志
          </div>
        ) : (
          logs.map((log, index) => {
            const config = levelConfig[log.level]
            return (
              <div 
                key={index}
                className={clsx('flex items-start gap-2 p-1 rounded', config.bg)}
              >
                <span className="text-gray-400 shrink-0">
                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                </span>
                {log.source && (
                  <span className={clsx('shrink-0 font-medium uppercase', sourceColors[log.source])}>
                    {log.source}
                  </span>
                )}
                <span className="shrink-0">{config.icon}</span>
                <span className="text-gray-700 dark:text-gray-300 break-all">
                  {log.message}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}