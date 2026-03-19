'use client'

import type { Hobby } from '@/lib/types'

type HobbyCardProps = {
  hobby: Hobby
  lastSession?: string
  onClick?: () => void
}

export default function HobbyCard({ hobby, lastSession, onClick }: HobbyCardProps) {
  const lastDate = lastSession
    ? new Date(lastSession).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full text-left rounded-xl bg-craft-gray-900 p-5 space-y-2
                  transition-all duration-150
                  ${
                    onClick
                      ? 'hover:bg-craft-gray-800 hover:ring-2 hover:ring-craft-pink-400/50 cursor-pointer'
                      : 'cursor-default'
                  }
                  focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-950`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl drop-shadow-[0_0_12px_rgba(255,88,222,0.4)]">
          {hobby.emoji}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-craft-gray-100">{hobby.name}</h3>
          <p className="text-sm text-craft-gray-400 truncate">{hobby.goal}</p>
        </div>
      </div>
      {lastDate && (
        <p className="text-xs text-craft-gray-500">Last session: {lastDate}</p>
      )}
    </button>
  )
}
