'use client'

import type { Message } from '@/lib/types'

type ChatMessageProps = {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant'

  // Strip JSON code blocks from display (system extracts them for SessionPlan)
  const displayContent = message.content.replace(/```json\n[\s\S]*?```/g, '').trim()

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed ${
          isAssistant
            ? 'bg-craft-blue-200 dark:bg-craft-blue-950/60 text-craft-gray-900 dark:text-craft-blue-100'
            : 'bg-craft-gray-800 text-craft-gray-100'
        }`}
      >
        {displayContent}
      </div>
    </div>
  )
}
