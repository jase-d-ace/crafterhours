'use client'

import type { Message } from '@/lib/types'

type ChatProps = {
  messages: Message[]
  onSend: (message: string) => void
}

export default function Chat({ messages, onSend }: ChatProps) {
  void messages
  void onSend
  return (
    <div className="flex flex-col h-full">
      <p className="text-gray-500">Chat — coming soon</p>
    </div>
  )
}
