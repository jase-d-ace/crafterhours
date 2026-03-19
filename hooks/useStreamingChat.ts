'use client'

import { useState, useCallback, useRef } from 'react'
import type { Message } from '@/lib/types'

export function useStreamingChat(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)

  const addAssistantMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content }])
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || isStreaming) return

      setMessages(prev => [...prev, { role: 'user', content: text }])
      setIsStreaming(true)

      const controller = new AbortController()
      streamAbortRef.current = controller

      try {
        const res = await fetch('/api/plan/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: text }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error('Stream failed')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        // Add empty assistant message that we'll update
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          const captured = fullResponse
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: captured }
            return updated
          })
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error('Streaming error:', e)
          setError('Lost connection during planning. Try sending your message again.')
        }
      } finally {
        setIsStreaming(false)
        streamAbortRef.current = null
      }
    },
    [sessionId, isStreaming]
  )

  const clearError = useCallback(() => setError(null), [])

  const reset = useCallback(() => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort()
    }
    setMessages([])
    setIsStreaming(false)
    setError(null)
  }, [])

  return { messages, isStreaming, error, sendMessage, addAssistantMessage, clearError, reset, setMessages }
}
