'use client'

import type { SessionPlan as SessionPlanType } from '@/lib/types'

type SessionPlanProps = {
  plan: SessionPlanType
}

export default function SessionPlan({ plan }: SessionPlanProps) {
  void plan
  return (
    <div>
      <p className="text-gray-500">Session plan — coming soon</p>
    </div>
  )
}
