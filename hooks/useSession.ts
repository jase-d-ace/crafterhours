'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  SessionPhase,
  Recommendation,
  Hobby,
  SessionPlan,
} from '@/lib/types'
import { useStreamingChat } from './useStreamingChat'

const VALID_PHASES = new Set(['warmup', 'main', 'cooldown', 'reflection'])

function extractSessionPlan(text: string): SessionPlan | null {
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (
      parsed &&
      typeof parsed.hobbyId === 'string' &&
      typeof parsed.duration === 'number' &&
      typeof parsed.intention === 'string' &&
      Array.isArray(parsed.structure) &&
      parsed.structure.length > 0 &&
      parsed.structure.every(
        (item: unknown) =>
          item !== null &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).goal === 'string' &&
          typeof (item as Record<string, unknown>).duration === 'number' &&
          VALID_PHASES.has((item as Record<string, unknown>).phase as string)
      )
    ) {
      return parsed as SessionPlan
    }
  } catch {
    // parse failed — stay in planning
  }
  return null
}

export function useSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [allHobbies, setAllHobbies] = useState<Hobby[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null)
  const [activeHobby, setActiveHobby] = useState<Hobby | null>(null)
  const [editCount, setEditCount] = useState(0)

  const { messages, isStreaming, sendMessage, setInitialMessages } = useStreamingChat()

  // Single useEffect: fetch recommendation on mount
  useEffect(() => {
    let cancelled = false
    setPhase('recommending')

    fetch('/api/recommend')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setRecommendation(data.recommendation)
        setAllHobbies(data.allHobbies)
        setPhase('recommended')
      })
      .catch(() => {
        // Recommendation failed — stay in recommending with error state
        // For now, silently fail since this is mock data
      })

    return () => {
      cancelled = true
    }
  }, [])

  const startPlanning = useCallback(
    async (hobby: Hobby) => {
      setActiveHobby(hobby)
      setPhase('planning')

      const res = await fetch('/api/plan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hobbyId: hobby.id }),
      })

      const data = await res.json()
      setSessionId(data.sessionId)
      setInitialMessages([{ role: 'assistant', content: data.openingMessage }])
    },
    [setInitialMessages]
  )

  const confirmHobby = useCallback(async () => {
    if (!recommendation) return
    await startPlanning(recommendation.hobby)
  }, [recommendation, startPlanning])

  const redirectHobby = useCallback(() => {
    setPhase('redirecting')
  }, [])

  const selectAlternative = useCallback(
    async (hobbyId: string) => {
      const hobby = allHobbies.find((h) => h.id === hobbyId)
      if (!hobby) return
      await startPlanning(hobby)
    },
    [allHobbies, startPlanning]
  )

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) return
      const response = await sendMessage(sessionId, text)
      const plan = extractSessionPlan(response)
      if (plan) {
        setSessionPlan(plan)
        setPhase('plan_presented')
      }
    },
    [sessionId, sendMessage]
  )

  const approvePlan = useCallback(async () => {
    if (!sessionId || !sessionPlan) return

    await fetch('/api/plan/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, sessionPlan }),
    })

    setPhase('confirmed')
  }, [sessionId, sessionPlan])

  const requestEdit = useCallback(() => {
    if (editCount >= 1) return
    setEditCount((c) => c + 1)
    setPhase('planning')
  }, [editCount])

  const abandonSession = useCallback(async () => {
    if (!sessionId) return
    await fetch('/api/plan/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  }, [sessionId])

  // Alternatives: all hobbies except the recommended one
  const alternatives = recommendation
    ? allHobbies.filter((h) => h.id !== recommendation.hobby.id)
    : []

  return {
    phase,
    recommendation,
    alternatives,
    activeHobby,
    sessionId,
    sessionPlan,
    messages,
    isStreaming,
    editCount,
    confirmHobby,
    redirectHobby,
    selectAlternative,
    handleSendMessage,
    approvePlan,
    requestEdit,
    abandonSession,
  }
}
