import { NextResponse } from 'next/server'
import { getSession, updateSessionPlan } from '@/lib/db'
import type { SessionPlan, PlanItem } from '@/lib/types'

const VALID_PLAN_ITEM_TYPES = ['warmup', 'main', 'cooldown', 'reflection']

function isValidPlanItem(item: unknown): item is PlanItem {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.durationMinutes === 'number' && obj.durationMinutes > 0 &&
    typeof obj.type === 'string' && VALID_PLAN_ITEM_TYPES.includes(obj.type)
  )
}

function isValidSessionPlan(plan: unknown): plan is SessionPlan {
  if (typeof plan !== 'object' || plan === null) return false
  const obj = plan as Record<string, unknown>
  return (
    typeof obj.hobbyId === 'string' &&
    typeof obj.duration === 'number' && obj.duration > 0 &&
    typeof obj.intention === 'string' &&
    Array.isArray(obj.structure) && obj.structure.length > 0 &&
    obj.structure.every(isValidPlanItem)
  )
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { sessionId, sessionPlan } = body

  if (!sessionId || !sessionPlan) {
    return NextResponse.json(
      { error: 'sessionId and sessionPlan required', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  if (!isValidSessionPlan(sessionPlan)) {
    return NextResponse.json(
      { error: 'Invalid session plan structure', code: 'INVALID_PLAN' },
      { status: 400 }
    )
  }

  const session = getSession(sessionId)
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    )
  }

  if (session.status !== 'planning') {
    return NextResponse.json(
      { error: 'Session cannot be confirmed in its current state', code: 'INVALID_SESSION_STATE' },
      { status: 409 }
    )
  }

  updateSessionPlan(sessionId, sessionPlan)
  console.log(`TODO: write calendar block for ${sessionPlan.hobbyId} at ${sessionPlan.duration}min`)

  return NextResponse.json({
    sessionId,
    status: 'confirmed',
    sessionPlan,
  })
}
