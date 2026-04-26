'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  SessionPhase,
  Recommendation,
  Hobby,
  SessionPlan,
  Artifact,
} from '@/lib/types'
import { useStreamingChat } from './useStreamingChat'

const VALID_PHASES = new Set(['warmup', 'main', 'cooldown', 'reflection'])

const ARTIFACT_TYPES: Record<string, Artifact['type']> = {
  hobby_guitar: 'practice_log',
  hobby_writing: 'journal',
  hobby_building: 'coding_summary',
}

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [dbSessionId, setDbSessionId] = useState<string | null>(null)
  const [artifactDraft, setArtifactDraft] = useState<string | null>(null)

  const { messages, isStreaming, sendMessage, setInitialMessages } = useStreamingChat()

  // Fetch recommendation on mount
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
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  // Timer: count up while session is active
  useEffect(() => {
    if (phase !== 'session_active') return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

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

    setElapsedSeconds(0)
    setPhase('session_active')
  }, [sessionId, sessionPlan])

  const requestEdit = useCallback(() => {
    if (editCount >= 1) return
    setEditCount((c) => c + 1)
    setPhase('planning')
  }, [editCount])

  const returnFromSession = useCallback(() => {
    setInitialMessages([
      ...messages,
      { role: 'assistant', content: "You're back. How did it go — what happened tonight?" },
    ])
    setPhase('logging')
  }, [messages, setInitialMessages])

  const logSession = useCallback(
    async (notes: string) => {
      if (!sessionId || !sessionPlan || !activeHobby) return

      const artifactType = ARTIFACT_TYPES[activeHobby.id] ?? 'journal'

      // Save the completed session to the sessions table
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          actualDuration: Math.max(1, Math.round(elapsedSeconds / 60)),
          notes,
          artifactType,
        }),
      })
      const { session } = await sessionRes.json()
      setDbSessionId(session.id)

      // Stream the artifact
      setArtifactDraft('')
      setPhase('artifact_preview')

      const artifactRes = await fetch('/api/artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, notes, hobbyId: activeHobby.id }),
      })

      if (!artifactRes.body) return
      const reader = artifactRes.body.getReader()
      const decoder = new TextDecoder()
      let draft = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        draft += decoder.decode(value, { stream: true })
        setArtifactDraft(draft)
      }
    },
    [sessionId, sessionPlan, activeHobby, elapsedSeconds]
  )

  const handleLoggingMessage = useCallback(
    async (text: string) => {
      // Add user message to chat then kick off the session save + artifact generation
      setInitialMessages([...messages, { role: 'user', content: text }])
      await logSession(text)
    },
    [messages, setInitialMessages, logSession]
  )

  const confirmSaveArtifact = useCallback(
    async (content: string) => {
      if (!dbSessionId || !activeHobby) return

      const type = ARTIFACT_TYPES[activeHobby.id] ?? 'journal'
      await fetch('/api/artifact/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbSessionId, hobbyId: activeHobby.id, type, content }),
      })

      setPhase('completed')
    },
    [dbSessionId, activeHobby]
  )

  const abandonSession = useCallback(async () => {
    if (!sessionId) return
    await fetch('/api/plan/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  }, [sessionId])

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
    elapsedSeconds,
    artifactDraft,
    confirmHobby,
    redirectHobby,
    selectAlternative,
    handleSendMessage,
    handleLoggingMessage,
    approvePlan,
    requestEdit,
    returnFromSession,
    confirmSaveArtifact,
    abandonSession,
  }
}
