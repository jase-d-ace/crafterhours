'use client'

import type { Recommendation } from '@/lib/types'

type RecommendationCardProps = {
  recommendation: Recommendation
  onConfirm: () => void
  onRedirect: () => void
}

export default function RecommendationCard({
  recommendation,
  onConfirm,
  onRedirect,
}: RecommendationCardProps) {
  const { hobby, reasoning, calendarContext, githubContext, lastSession, confidence } =
    recommendation

  const lastSessionLabel = lastSession
    ? `Last session: ${new Date(lastSession).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : null

  return (
    <div className="animate-fade-in rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{hobby.emoji}</span>
        <div>
          <h2 className="text-xl font-semibold text-craft-gray-50">{hobby.name}</h2>
          <p className="text-sm text-craft-gray-400">{hobby.goal}</p>
        </div>
      </div>

      <p className="text-craft-gray-200 leading-relaxed">{reasoning}</p>

      <div className="flex flex-wrap gap-2">
        {calendarContext && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-craft-blue-950/50 px-3 py-1.5 text-xs text-craft-blue-300">
            <span>📅</span> {calendarContext}
          </span>
        )}
        {githubContext && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-craft-gray-800 px-3 py-1.5 text-xs text-craft-gray-300">
            <span>💻</span> {githubContext}
          </span>
        )}
        {lastSessionLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-craft-gray-800 px-3 py-1.5 text-xs text-craft-gray-400">
            {lastSessionLabel}
          </span>
        )}
      </div>

      <div className="w-full bg-craft-gray-800 rounded-full h-1">
        <div
          className="bg-craft-blue-400 h-1 rounded-full transition-all duration-500"
          style={{ width: `${Math.round(confidence * 100)}%` }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-craft-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-craft-blue-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-900"
        >
          Let&apos;s go
        </button>
        <button
          onClick={onRedirect}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-craft-gray-400 hover:text-craft-gray-200 hover:bg-craft-gray-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-900"
        >
          Actually, I&apos;d rather&hellip;
        </button>
      </div>
    </div>
  )
}
