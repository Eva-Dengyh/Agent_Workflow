'use client'

import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { clsx } from 'clsx'

interface CodeEditorProps {
  initialValue?: string
  language?: string
  readOnly?: boolean
  onChange?: (value: string) => void
  onSave?: (value: string) => void
}

export function CodeEditor({ 
  initialValue = '', 
  language = 'typescript',
  readOnly = false,
  onChange,
  onSave 
}: CodeEditorProps) {
  const [value, setValue] = useState(initialValue)
  const [isSaved, setIsSaved] = useState(true)
  
  const handleChange = useCallback((newValue: string | undefined) => {
    const val = newValue || ''
    setValue(val)
    setIsSaved(false)
    onChange?.(val)
  }, [onChange])
  
  const handleSave = useCallback(() => {
    onSave?.(value)
    setIsSaved(true)
  }, [value, onSave])
  
  return (
    <div className={clsx(
      'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden',
      readOnly && 'opacity-75'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">{language}</span>
          {!readOnly && (
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded',
              isSaved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            )}>
              {isSaved ? '已保存' : '未保存'}
            </span>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={clsx(
                'px-3 py-1 text-xs rounded transition-colors',
                isSaved 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              )}
            >
              保存
            </button>
          </div>
        )}
      </div>
      
      {/* Editor */}
      <div className="h-96">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            readOnly,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2
          }}
        />
      </div>
    </div>
  )
}