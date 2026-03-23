'use client'

import { useState, useCallback } from 'react'
import type { Message } from '@/lib/types'

export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const setInitialMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs)
  }, [])

  const sendMessage = useCallback(
    async (sessionId: string, text: string): Promise<string> => {
      const userMessage: Message = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)

      let fullResponse = ''

      try {
        const res = await fetch('/api/plan/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
        })

        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        // Add empty assistant message to fill progressively
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: fullResponse,
            }
            return updated
          })
        }
      } finally {
        setIsStreaming(false)
      }

      return fullResponse
    },
    []
  )

  return { messages, isStreaming, sendMessage, setInitialMessages }
}
