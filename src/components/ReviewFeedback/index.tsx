'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { ReviewIssue } from '@/types'
import { format } from 'date-fns'

interface ReviewFeedbackProps {
  issues: ReviewIssue[]
  passed: boolean
  summary?: string
  onFixIssue?: (issueId: string) => void
  onResubmit?: () => void
}

const severityConfig = {
  error: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', label: '错误' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', label: '警告' },
  info: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', label: '提示' }
}

export function ReviewFeedback({ issues, passed, summary, onFixIssue, onResubmit }: ReviewFeedbackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const fixedCount = issues.filter(i => i.fixed).length
  
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">审查报告</h3>
        <span className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          passed 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {passed ? '✓ 通过' : `${issues.length} 个问题待修复`}
        </span>
      </div>
      
      {/* Summary */}
      {summary && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400">
          {summary}
        </div>
      )}
      
      {/* Progress */}
      {!passed && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>修复进度</span>
            <span>{fixedCount}/{issues.length}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(fixedCount / issues.length) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-3">
          {issues.map((issue) => {
            const config = severityConfig[issue.severity]
            const isExpanded = expandedId === issue.id
            
            return (
              <div 
                key={issue.id}
                className={clsx(
                  'rounded-lg border transition-all',
                  issue.fixed 
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
                    : config.border
                )}
              >
                {/* Issue Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                  className="w-full p-3 flex items-center gap-3 text-left"
                >
                  <span className={clsx('text-sm font-medium', config.color)}>
                    {config.label}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                    {issue.description}
                  </span>
                  <span className={clsx(
                    'w-5 h-5 rounded flex items-center justify-center text-xs',
                    issue.fixed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}>
                    {issue.fixed ? '✓' : '!'}
                  </span>
                </button>
                
                {/* Issue Details */}
                {isExpanded && !issue.fixed && (
                  <div className="px-3 pb-3 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">位置</p>
                      <code className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                        {issue.location}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">建议修复</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{issue.suggestion}</p>
                    </div>
                    {issue.referenceCode && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">参考代码</p>
                        <pre className="text-sm bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                          <code>{issue.referenceCode}</code>
                        </pre>
                      </div>
                    )}
                    <button
                      onClick={() => onFixIssue?.(issue.id)}
                      className="w-full px-3 py-2 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600 transition-colors"
                    >
                      已修复，标记
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Actions */}
      {!passed && fixedCount === issues.length && (
        <button
          onClick={onResubmit}
          className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          提交复审
        </button>
      )}
      
      {/* Last updated */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        最后更新: {format(new Date(), 'HH:mm:ss')}
      </p>
    </div>
  )
}