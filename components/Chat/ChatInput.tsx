'use client'

import { useRef, useCallback } from 'react'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resetHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [])

  const handleSubmit = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const text = el.value.trim()
    if (!text || disabled) return
    onSend(text)
    el.value = ''
    el.style.height = 'auto'
  }, [onSend, disabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="flex items-end gap-2 rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-2">
      <textarea
        ref={textareaRef}
        rows={1}
        disabled={disabled}
        placeholder={disabled ? 'Thinking...' : 'Type a message...'}
        onInput={resetHeight}
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none bg-transparent text-sm text-craft-gray-100 placeholder:text-craft-gray-500 focus:outline-none disabled:opacity-50 px-2 py-1.5"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="shrink-0 rounded-lg bg-craft-blue-600 p-2 text-white hover:bg-craft-blue-500 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-craft-pink-400"
        aria-label="Send message"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-90">
          <path d="M8 2L14 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 8H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
