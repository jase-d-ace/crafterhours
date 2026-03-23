'use client'

import { useRef, useEffect } from 'react'
import type { Message } from '@/lib/types'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

type ChatProps = {
  messages: Message[]
  onSend: (message: string) => void
  isStreaming: boolean
}

export default function Chat({ messages, onSend, isStreaming }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages / streaming tokens — legitimate useEffect for DOM sync
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showTypingIndicator =
    isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {showTypingIndicator && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-craft-blue-950 px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-craft-blue-400 animate-typing-dot" />
              <span className="w-2 h-2 rounded-full bg-craft-blue-400 animate-typing-dot" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-craft-blue-400 animate-typing-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 pt-2">
        <ChatInput onSend={onSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
