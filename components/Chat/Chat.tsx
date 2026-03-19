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

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-craft-blue-200 dark:bg-craft-blue-950/60 rounded-2xl px-4 py-3 flex gap-1.5">
        <span className="typing-dot w-2 h-2 rounded-full bg-craft-blue-400" />
        <span className="typing-dot w-2 h-2 rounded-full bg-craft-blue-400" />
        <span className="typing-dot w-2 h-2 rounded-full bg-craft-blue-400" />
      </div>
    </div>
  )
}

export default function Chat({ messages, onSend, isStreaming }: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const showTyping =
    isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user')

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {showTyping && <TypingIndicator />}
      </div>
      <div className="shrink-0 pt-2">
        <ChatInput onSend={onSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
