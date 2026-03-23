'use client'

import type { Hobby } from '@/lib/types'

type HobbyCardProps = {
  hobby: Hobby
  lastSession?: string
  onClick?: () => void
}

export default function HobbyCard({ hobby, lastSession, onClick }: HobbyCardProps) {
  const lastLabel = lastSession
    ? `Last: ${new Date(lastSession).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-4 space-y-2 transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:border-craft-pink-400/50 hover:bg-craft-gray-800 focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-950'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{hobby.emoji}</span>
        <h3 className="text-base font-medium text-craft-gray-50">{hobby.name}</h3>
      </div>
      <p className="text-sm text-craft-gray-400 line-clamp-2">{hobby.goal}</p>
      {lastLabel && (
        <p className="text-xs text-craft-gray-500">{lastLabel}</p>
      )}
    </button>
  )
}
