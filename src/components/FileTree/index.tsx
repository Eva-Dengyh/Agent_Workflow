'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { ProjectFile } from '@/types'

interface FileTreeProps {
  files: ProjectFile[]
  onFileClick?: (file: ProjectFile) => void
  selectedPath?: string
}

function FileIcon({ type, name }: { type: 'file' | 'directory', name: string }) {
  if (type === 'directory') {
    return (
      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    )
  }
  
  const ext = name.split('.').pop()?.toLowerCase()
  const colors: Record<string, string> = {
    ts: 'text-blue-500',
    tsx: 'text-blue-500',
    js: 'text-yellow-500',
    jsx: 'text-yellow-500',
    json: 'text-gray-500',
    md: 'text-gray-400',
    css: 'text-pink-500',
    png: 'text-purple-500',
    jpg: 'text-purple-500'
  }
  
  return (
    <svg className={clsx('w-4 h-4', colors[ext || ''] || 'text-gray-400')} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  )
}

function FileTreeItem({ 
  file, 
  depth = 0, 
  onFileClick,
  selectedPath 
}: { 
  file: ProjectFile
  depth?: number
  onFileClick?: (file: ProjectFile) => void
  selectedPath?: string
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2)
  const hasChildren = file.type === 'directory' && file.children && file.children.length > 0
  const isSelected = selectedPath === file.path
  
  return (
    <div>
      <div
        onClick={() => {
          if (file.type === 'directory') {
            setIsExpanded(!isExpanded)
          } else {
            onFileClick?.(file)
          }
        }}
        className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors',
          isSelected 
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren && (
          <span className="text-xs text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <FileIcon type={file.type} name={file.name} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
        {file.status && (
          <span className={clsx(
            'ml-auto text-xs px-1.5 py-0.5 rounded',
            file.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            file.status === 'in_progress' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            file.status === 'pending' && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          )}>
            {file.status === 'completed' && '✓'}
            {file.status === 'in_progress' && '●'}
            {file.status === 'pending' && '○'}
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {file.children!.map((child, index) => (
            <FileTreeItem 
              key={index} 
              file={child} 
              depth={depth + 1}
              onFileClick={onFileClick}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ files, onFileClick, selectedPath }: FileTreeProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">项目结构</h3>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            暂无文件
          </div>
        ) : (
          files.map((file, index) => (
            <FileTreeItem 
              key={index} 
              file={file} 
              onFileClick={onFileClick}
              selectedPath={selectedPath}
            />
          ))
        )}
      </div>
    </div>
  )
}