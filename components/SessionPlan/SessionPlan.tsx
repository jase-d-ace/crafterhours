'use client'

import type { SessionPlan as SessionPlanType } from '@/lib/types'

type SessionPlanProps = {
  plan: SessionPlanType
  onApprove: () => void
  onRequestEdit: () => void
  editable: boolean
}

const typeBadgeColors: Record<string, string> = {
  warmup: 'bg-amber-900/40 text-amber-300',
  main: 'bg-craft-blue-950/60 text-craft-blue-300',
  cooldown: 'bg-emerald-900/40 text-emerald-300',
  reflection: 'bg-purple-900/40 text-purple-300',
}

export default function SessionPlan({
  plan,
  onApprove,
  onRequestEdit,
  editable,
}: SessionPlanProps) {
  return (
    <div className="rounded-xl bg-craft-gray-900 p-5 space-y-4">
      <p className="text-craft-gray-200 font-medium italic">&ldquo;{plan.intention}&rdquo;</p>
      <p className="text-sm text-craft-gray-400">{plan.duration} minutes total</p>

      <div className="space-y-3">
        {plan.structure.map((item, i) => (
          <div
            key={i}
            className="rounded-lg bg-craft-gray-800 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  typeBadgeColors[item.type] || typeBadgeColors.main
                }`}
              >
                {item.type}
              </span>
              <h4 className="text-sm font-semibold text-craft-gray-100">{item.title}</h4>
              <span className="ml-auto text-xs text-craft-gray-500">
                {item.durationMinutes}min
              </span>
            </div>
            <p className="text-sm text-craft-gray-300 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={onApprove}
            className="flex-1 rounded-lg bg-craft-blue-500 px-4 py-2.5 font-medium text-white
                       hover:bg-craft-blue-600 active:bg-craft-blue-700
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-950"
          >
            Looks good
          </button>
          <button
            onClick={onRequestEdit}
            className="rounded-lg px-4 py-2.5 text-craft-gray-300
                       hover:text-craft-gray-100 hover:bg-craft-gray-800
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-950"
          >
            One change...
          </button>
        </div>
      )}
    </div>
  )
}
