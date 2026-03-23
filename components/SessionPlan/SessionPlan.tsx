'use client'

import type { SessionPlan as SessionPlanType, PlanItem } from '@/lib/types'

type SessionPlanProps = {
  plan: SessionPlanType
  onApprove: () => void
  onRequestEdit: () => void
  editable: boolean
}

const typeBadgeStyles: Record<PlanItem['type'], string> = {
  warmup: 'bg-amber-900/40 text-amber-300',
  main: 'bg-craft-blue-950 text-craft-blue-300',
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
    <div className="animate-slide-up rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-craft-gray-400 uppercase tracking-wider">
          Session plan
        </h3>
        <p className="text-craft-gray-100 font-medium">{plan.intention}</p>
        <p className="text-xs text-craft-gray-500">{plan.duration} minutes</p>
      </div>

      <div className="space-y-2">
        {plan.structure.map((item, i) => (
          <div
            key={i}
            className="rounded-lg bg-craft-gray-800/50 border border-craft-gray-800 p-3 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeBadgeStyles[item.type]}`}
                >
                  {item.type}
                </span>
                <span className="text-sm font-medium text-craft-gray-100">
                  {item.title}
                </span>
              </div>
              <span className="text-xs text-craft-gray-500 shrink-0">
                {item.durationMinutes}m
              </span>
            </div>
            <p className="text-xs text-craft-gray-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={onApprove}
            className="flex-1 rounded-lg bg-craft-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-craft-blue-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-900"
          >
            Looks good
          </button>
          <button
            onClick={onRequestEdit}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-craft-gray-400 hover:text-craft-gray-200 hover:bg-craft-gray-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-craft-pink-400 focus:ring-offset-2 focus:ring-offset-craft-gray-900"
          >
            One change&hellip;
          </button>
        </div>
      )}
    </div>
  )
}
