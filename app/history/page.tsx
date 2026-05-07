'use client'

import { useEffect, useState } from 'react'
import type { SessionDetail } from '@/lib/types'

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000)

  if (dayDiff === 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function firstLine(text: string): string {
  const trimmed = text.trim()
  const newlineIdx = trimmed.indexOf('\n')
  return newlineIdx === -1 ? trimmed : trimmed.slice(0, newlineIdx)
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionDetail[] | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions))
      .catch(() => setSessions([]))
  }, [])

  if (sessions === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-5 animate-pulse-skeleton h-24"
          />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-8 text-center">
        <p className="text-sm text-craft-gray-400">
          No sessions yet — finish your first one and it&apos;ll show up here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const isOpen = expanded === s.id
        return (
          <div
            key={s.id}
            className="rounded-xl bg-craft-gray-900 border border-craft-gray-800 overflow-hidden transition-colors"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : s.id)}
              className="w-full text-left p-5 hover:bg-craft-gray-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{s.hobby.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-craft-gray-100">{s.hobby.name}</span>
                    <span className="text-xs text-craft-gray-500 shrink-0">
                      {formatRelativeDate(s.createdAt)} · {s.duration} min
                    </span>
                  </div>
                  {s.notes && (
                    <p className="text-sm text-craft-gray-400 truncate mt-1">
                      {firstLine(s.notes)}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-craft-gray-800 p-5 space-y-4 animate-fade-in">
                {s.notes && (
                  <div>
                    <span className="text-xs font-medium text-craft-gray-500 uppercase tracking-wide">
                      Notes
                    </span>
                    <p className="mt-2 text-sm text-craft-gray-200 whitespace-pre-wrap">
                      {s.notes}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-craft-gray-500 uppercase tracking-wide">
                    Artifact
                  </span>
                  {s.artifact ? (
                    <pre className="mt-2 text-sm text-craft-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {s.artifact.content}
                    </pre>
                  ) : (
                    <p className="mt-2 text-sm text-craft-gray-500 italic">No artifact saved.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
