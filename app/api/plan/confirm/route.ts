import { NextResponse } from 'next/server'
import { mockConfirmPlan, mockGetSession } from '@/lib/mocks/plan'
import type { SessionPlan, PlanItem } from '@/lib/types'

function isValidPlanItem(item: unknown): item is PlanItem {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.durationMinutes === 'number' &&
    typeof obj.type === 'string' &&
    ['warmup', 'main', 'cooldown', 'reflection'].includes(obj.type as string)
  )
}

function isValidSessionPlan(plan: unknown): plan is SessionPlan {
  if (typeof plan !== 'object' || plan === null) return false
  const obj = plan as Record<string, unknown>
  return (
    typeof obj.hobbyId === 'string' &&
    typeof obj.duration === 'number' &&
    typeof obj.intention === 'string' &&
    Array.isArray(obj.structure) &&
    obj.structure.every(isValidPlanItem)
  )
}

export async function POST(request: Request) {
  let body: { sessionId?: string; sessionPlan?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

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

  // TODO: replace with real implementation
  const session = mockGetSession(sessionId)
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

  console.log(`TODO: write calendar block for ${sessionPlan.hobbyId} at ${sessionPlan.duration}min`)

  const result = mockConfirmPlan(sessionId, sessionPlan)
  return NextResponse.json(result)
}
