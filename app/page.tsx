'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/hooks/useSession'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import RecommendationCard from '@/components/RecommendationCard/RecommendationCard'
import HobbyCard from '@/components/HobbyCard/HobbyCard'
import Chat from '@/components/Chat/Chat'
import SessionPlanComponent from '@/components/SessionPlan/SessionPlan'
import type { SessionPlan } from '@/lib/types'

function extractSessionPlan(content: string): SessionPlan | null {
  const match = content.match(/```json\n([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.hobbyId && parsed.duration && parsed.intention && Array.isArray(parsed.structure)) {
      return parsed as SessionPlan
    }
  } catch {
    // Invalid JSON — stay in planning
  }
  return null
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-craft-gray-900 p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-craft-gray-800" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 rounded bg-craft-gray-800" />
          <div className="h-3 w-24 rounded bg-craft-gray-800" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-craft-gray-800" />
        <div className="h-3 w-4/5 rounded bg-craft-gray-800" />
        <div className="h-3 w-3/5 rounded bg-craft-gray-800" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-10 flex-1 rounded-lg bg-craft-gray-800" />
        <div className="h-10 w-40 rounded-lg bg-craft-gray-800" />
      </div>
    </div>
  )
}

export default function Home() {
  const session = useSession()
  const chat = useStreamingChat(session.sessionId)
  const planningInitiated = useRef(false)

  const {
    phase,
    recommendation,
    selectedHobby,
    sessionPlan,
    hasEditedPlan,
    alternativeHobbies,
    confirmRecommendation,
    redirectToAlternatives,
    selectAlternativeHobby,
    startPlanning,
    presentPlan,
    approvePlan,
    requestPlanEdit,
  } = session

  // Start planning when phase transitions to 'planning'
  useEffect(() => {
    if (phase !== 'planning' || !selectedHobby || planningInitiated.current) return
    planningInitiated.current = true

    async function init() {
      const openingMessage = await startPlanning(selectedHobby!.id)
      if (openingMessage) {
        chat.addAssistantMessage(openingMessage)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedHobby])

  // Check for SessionPlan in latest assistant message
  useEffect(() => {
    if (phase !== 'planning' || chat.isStreaming) return
    const lastMsg = chat.messages[chat.messages.length - 1]
    if (lastMsg?.role !== 'assistant') return

    const plan = extractSessionPlan(lastMsg.content)
    if (plan) {
      presentPlan(plan)
    }
  }, [phase, chat.messages, chat.isStreaming, presentPlan])

  const handleConfirm = useCallback(() => {
    confirmRecommendation()
  }, [confirmRecommendation])

  const handleRedirect = useCallback(() => {
    redirectToAlternatives()
  }, [redirectToAlternatives])

  const handlePlanEdit = useCallback(() => {
    requestPlanEdit()
    planningInitiated.current = false
  }, [requestPlanEdit])

  return (
    <main className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 w-full max-w-[640px] mx-auto px-4 py-6 flex flex-col">
        {/* idle / recommending */}
        {(phase === 'idle' || phase === 'recommending') && (
          <div className="flex-1 flex items-center">
            <div className="w-full transition-opacity duration-300 ease-out opacity-100">
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* recommended */}
        {phase === 'recommended' && recommendation && (
          <div className="flex-1 flex items-center">
            <div className="w-full transition-opacity duration-400 ease-in-out animate-[fadeIn_400ms_ease]">
              <RecommendationCard
                recommendation={recommendation}
                onConfirm={handleConfirm}
                onRedirect={handleRedirect}
              />
            </div>
          </div>
        )}

        {/* redirecting */}
        {phase === 'redirecting' && (
          <div className="flex-1 flex items-center">
            <div className="w-full space-y-3">
              <p className="text-sm text-craft-gray-400 mb-4">What are you in the mood for instead?</p>
              {alternativeHobbies.map((hobby, i) => (
                <div
                  key={hobby.id}
                  className="animate-[slideUp_300ms_ease-out_both]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <HobbyCard
                    hobby={hobby}
                    onClick={() => selectAlternativeHobby(hobby)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* planning */}
        {phase === 'planning' && (
          <div className="flex-1 flex flex-col min-h-0 animate-[slideUp_400ms_ease]">
            {selectedHobby && (
              <div className="shrink-0 flex items-center gap-2 pb-4 border-b border-craft-gray-800 mb-4">
                <span className="text-2xl">{selectedHobby.emoji}</span>
                <h2 className="font-semibold text-craft-gray-100">{selectedHobby.name}</h2>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <Chat
                messages={chat.messages}
                onSend={chat.sendMessage}
                isStreaming={chat.isStreaming}
              />
            </div>
          </div>
        )}

        {/* plan_presented */}
        {phase === 'plan_presented' && sessionPlan && (
          <div className="flex-1 flex flex-col min-h-0">
            {selectedHobby && (
              <div className="shrink-0 flex items-center gap-2 pb-4 border-b border-craft-gray-800 mb-4">
                <span className="text-2xl">{selectedHobby.emoji}</span>
                <h2 className="font-semibold text-craft-gray-100">{selectedHobby.name}</h2>
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="opacity-50 space-y-3">
                {chat.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-craft-blue-950/60 text-craft-blue-100'
                          : 'bg-craft-gray-800 text-craft-gray-100'
                      }`}
                    >
                      {msg.content.replace(/```json\n[\s\S]*?```/g, '').trim()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="animate-[slideUp_300ms_ease-out]">
                <SessionPlanComponent
                  plan={sessionPlan}
                  onApprove={approvePlan}
                  onRequestEdit={handlePlanEdit}
                  editable={!hasEditedPlan || phase === 'plan_presented'}
                />
              </div>
            </div>
          </div>
        )}

        {/* confirmed */}
        {phase === 'confirmed' && sessionPlan && selectedHobby && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 animate-[fadeIn_300ms_ease_200ms_both]">
              <span className="text-6xl block drop-shadow-[0_0_20px_rgba(255,88,222,0.5)]">
                {selectedHobby.emoji}
              </span>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-craft-gray-100">Session in progress</h2>
                <p className="text-craft-gray-300 italic">&ldquo;{sessionPlan.intention}&rdquo;</p>
                <p className="text-sm text-craft-gray-500">{sessionPlan.duration} minutes</p>
              </div>
              <div className="pt-4">
                <SessionPlanComponent
                  plan={sessionPlan}
                  onApprove={() => {}}
                  onRequestEdit={() => {}}
                  editable={false}
                />
              </div>
              <button
                disabled
                className="mt-6 rounded-lg bg-craft-gray-800 px-6 py-2.5 text-craft-gray-500
                           cursor-not-allowed"
              >
                Finish session (coming soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
