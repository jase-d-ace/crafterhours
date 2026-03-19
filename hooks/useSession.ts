'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Recommendation, SessionPlan, SessionPhase } from '@/lib/types'
import { getDefaultHobbies } from '@/lib/hobbies'
import type { Hobby } from '@/lib/types'

export function useSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [hasEditedPlan, setHasEditedPlan] = useState(false)

  // Auto-fetch recommendation on mount
  useEffect(() => {
    async function fetchRecommendation() {
      setPhase('recommending')
      try {
        const res = await fetch('/api/recommend')
        const data = await res.json()
        setRecommendation(data.recommendation)
        setPhase('recommended')
      } catch (e) {
        console.error('Failed to fetch recommendation:', e)
        setPhase('idle')
      }
    }
    fetchRecommendation()
  }, [])

  const confirmRecommendation = useCallback(async () => {
    if (!recommendation) return
    setSelectedHobby(recommendation.hobby)
    setPhase('planning')
  }, [recommendation])

  const redirectToAlternatives = useCallback(() => {
    if (hasRedirected) return
    setHasRedirected(true)
    setPhase('redirecting')
  }, [hasRedirected])

  const selectAlternativeHobby = useCallback(async (hobby: Hobby) => {
    setSelectedHobby(hobby)
    setPhase('planning')
  }, [])

  const startPlanning = useCallback(
    async (hobbyId: string) => {
      try {
        const res = await fetch('/api/plan/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hobbyId }),
        })
        const data = await res.json()
        setSessionId(data.sessionId)
        return data.openingMessage as string
      } catch (e) {
        console.error('Failed to start planning:', e)
        return null
      }
    },
    []
  )

  const presentPlan = useCallback((plan: SessionPlan) => {
    setSessionPlan(plan)
    setPhase('plan_presented')
  }, [])

  const approvePlan = useCallback(async () => {
    if (!sessionId || !sessionPlan) return
    try {
      await fetch('/api/plan/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, sessionPlan }),
      })
      setPhase('confirmed')
    } catch (e) {
      console.error('Failed to confirm plan:', e)
    }
  }, [sessionId, sessionPlan])

  const requestPlanEdit = useCallback(() => {
    if (hasEditedPlan) return
    setHasEditedPlan(true)
    setSessionPlan(null)
    setPhase('planning')
  }, [hasEditedPlan])

  const alternativeHobbies = recommendation
    ? getDefaultHobbies().filter(h => h.id !== recommendation.hobby.id && h.active)
    : []

  return {
    phase,
    setPhase,
    recommendation,
    selectedHobby,
    sessionId,
    sessionPlan,
    hasRedirected,
    hasEditedPlan,
    alternativeHobbies,
    confirmRecommendation,
    redirectToAlternatives,
    selectAlternativeHobby,
    startPlanning,
    presentPlan,
    approvePlan,
    requestPlanEdit,
  }
}
