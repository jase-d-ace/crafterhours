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
  const { hobby, reasoning, calendarContext, githubContext, lastSession, confidence } = recommendation

  const lastSessionDate = lastSession
    ? new Date(lastSession).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div className="rounded-xl bg-craft-gray-900 dark:bg-craft-gray-900 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,88,222,0.4)]">
          {hobby.emoji}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-craft-gray-50">{hobby.name}</h2>
          {lastSessionDate && (
            <p className="text-sm text-craft-gray-400">Last session: {lastSessionDate}</p>
          )}
        </div>
        <div
          className="ml-auto w-2 h-2 rounded-full"
          style={{ opacity: confidence }}
          title={`${Math.round(confidence * 100)}% confidence`}
        >
          <div className="w-full h-full rounded-full bg-craft-blue-400" />
        </div>
      </div>

      <p className="text-craft-gray-200 leading-relaxed">{reasoning}</p>

      {(calendarContext || githubContext) && (
        <div className="space-y-2 text-sm text-craft-gray-400">
          {calendarContext && (
            <p className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">📅</span>
              {calendarContext}
            </p>
          )}
          {githubContext && (
            <p className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">💻</span>
              {githubContext}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-craft-blue-500 px-4 py-2.5 font-medium text-white
                     hover:bg-craft-blue-600 active:bg-craft-blue-700
                     transition-colors duration-150
                     focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-950"
        >
          Let&apos;s go
        </button>
        <button
          onClick={onRedirect}
          className="rounded-lg px-4 py-2.5 text-craft-gray-300
                     hover:text-craft-gray-100 hover:bg-craft-gray-800
                     transition-colors duration-150
                     focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-950"
        >
          Actually, I&apos;d rather...
        </button>
      </div>
    </div>
  )
}
