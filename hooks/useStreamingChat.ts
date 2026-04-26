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

          // Hide the JSON block even as it streams in — strip from the opening
          // fence to the end of what's accumulated so far
          const displayContent = fullResponse.replace(/```json[\s\S]*/, '').trim()

          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: displayContent }
            return updated
          })
        }

        // Strip JSON blocks from the displayed message after streaming completes
        const displayContent = fullResponse.replace(/```json[\s\S]*?```/g, '').trim()
        if (displayContent !== fullResponse) {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: displayContent }
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
