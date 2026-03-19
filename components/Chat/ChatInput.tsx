'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    // Max 4 lines (~96px)
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="flex items-end gap-2 p-3 bg-craft-gray-900 rounded-xl border border-craft-gray-800">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Thinking...' : 'Type a message...'}
        rows={1}
        className={`flex-1 resize-none bg-transparent text-craft-gray-100 placeholder:text-craft-gray-500
                    focus:outline-none text-sm leading-6 ${disabled ? 'opacity-50' : ''}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-lg bg-craft-blue-500 p-2 text-white
                   hover:bg-craft-blue-600 active:bg-craft-blue-700
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-craft-pink-400"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
