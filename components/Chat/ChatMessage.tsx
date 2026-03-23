'use client'

import type { Message } from '@/lib/types'

type ChatMessageProps = {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isAssistant
            ? 'bg-craft-blue-200 text-craft-gray-900 dark:bg-craft-blue-950 dark:text-craft-blue-100'
            : 'bg-craft-gray-200 text-craft-gray-900 dark:bg-craft-gray-800 dark:text-craft-gray-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
