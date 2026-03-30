'use client'

import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { AgentMessage, AgentType } from '@/types'
import { format } from 'date-fns'

interface AgentChatProps {
  agentType: AgentType
  agentName: string
  messages: AgentMessage[]
  onSendMessage: (content: string) => void
  isLoading?: boolean
}

const agentColors: Record<AgentType, string> = {
  planner: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  coder: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  reviewer: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
}

const agentAvatars: Record<AgentType, string> = {
  planner: '📋',
  coder: '💻',
  reviewer: '🔍'
}

export function AgentChat({ agentType, agentName, messages, onSendMessage, isLoading }: AgentChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }
  
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className={clsx(
        'px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 shrink-0',
        agentColors[agentType]
      )}>
        <span className="text-xl">{agentAvatars[agentType]}</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{agentName}</h3>
          <p className="text-xs text-gray-500">
            {isLoading ? '思考中...' : '在线'}
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-16 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-2xl mb-2">{agentAvatars[agentType]}</p>
            <p>开始和 {agentName} 对话吧</p>
            <p className="text-sm mt-2">你是 {agentName}，有什么需要帮忙的？</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index}
              className={clsx(
                'flex gap-2',
                msg.agentType === agentType ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0',
                msg.agentType === 'planner' && 'bg-blue-100 text-blue-600',
                msg.agentType === 'coder' && 'bg-emerald-100 text-emerald-600',
                msg.agentType === 'reviewer' && 'bg-amber-100 text-amber-600'
              )}>
                {agentAvatars[msg.agentType]}
              </div>
              <div className={clsx(
                'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                msg.agentType === agentType
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={clsx(
                  'text-xs mt-1',
                  msg.agentType === agentType ? 'text-emerald-200' : 'text-gray-400'
                )}>
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {agentAvatars[agentType]}
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor - always at bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`发送消息给 ${agentName}...`}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  )
}