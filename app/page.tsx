'use client'

import { useSession } from '@/hooks/useSession'
import RecommendationCard from '@/components/RecommendationCard/RecommendationCard'
import HobbyCard from '@/components/HobbyCard/HobbyCard'
import Chat from '@/components/Chat/Chat'
import SessionPlanView from '@/components/SessionPlan/SessionPlan'
import ArtifactPreview from '@/components/ArtifactPreview/ArtifactPreview'

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-6 space-y-4 animate-pulse-skeleton">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-craft-gray-800" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 rounded bg-craft-gray-800" />
          <div className="h-3 w-48 rounded bg-craft-gray-800" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-craft-gray-800" />
        <div className="h-3 w-3/4 rounded bg-craft-gray-800" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-10 flex-1 rounded-lg bg-craft-gray-800" />
        <div className="h-10 w-36 rounded-lg bg-craft-gray-800" />
      </div>
    </div>
  )
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function HomePage() {
  const {
    phase,
    recommendation,
    alternatives,
    activeHobby,
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
  } = useSession()

  return (
    <div className="flex flex-col h-[calc(100vh-56px-2rem)]">
      {/* Idle / Recommending */}
      {(phase === 'idle' || phase === 'recommending') && (
        <div className="animate-fade-in">
          <SkeletonCard />
        </div>
      )}

      {/* Recommended */}
      {phase === 'recommended' && recommendation && (
        <RecommendationCard
          recommendation={recommendation}
          onConfirm={confirmHobby}
          onRedirect={redirectHobby}
        />
      )}

      {/* Redirecting */}
      {phase === 'redirecting' && (
        <div className="space-y-3">
          <p className="text-sm text-craft-gray-400 mb-4">
            What are you feeling tonight?
          </p>
          {alternatives.map((hobby, i) => (
            <div
              key={hobby.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <HobbyCard
                hobby={hobby}
                onClick={() => selectAlternative(hobby.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Planning */}
      {phase === 'planning' && (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          {activeHobby && (
            <div className="shrink-0 flex items-center gap-2 pb-3 mb-3 border-b border-craft-gray-800">
              <span className="text-lg">{activeHobby.emoji}</span>
              <span className="text-sm font-medium text-craft-gray-300">
                Planning {activeHobby.name} session
              </span>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <Chat
              messages={messages}
              onSend={handleSendMessage}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      )}

      {/* Plan Presented */}
      {phase === 'plan_presented' && sessionPlan && (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          {activeHobby && (
            <div className="shrink-0 flex items-center gap-2 pb-3 mb-3 border-b border-craft-gray-800">
              <span className="text-lg">{activeHobby.emoji}</span>
              <span className="text-sm font-medium text-craft-gray-300">
                Planning {activeHobby.name} session
              </span>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="opacity-50 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-craft-blue-950 text-craft-blue-100'
                      : 'bg-craft-gray-800 text-craft-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 pt-4 animate-slide-up">
            <SessionPlanView
              plan={sessionPlan}
              onApprove={approvePlan}
              onRequestEdit={requestEdit}
              editable={editCount < 1}
            />
          </div>
        </div>
      )}

      {/* Session Active */}
      {phase === 'session_active' && sessionPlan && (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          {activeHobby && (
            <div className="text-center space-y-2 animate-slide-up">
              <span className="text-5xl block">{activeHobby.emoji}</span>
              <h2 className="text-xl font-semibold text-craft-gray-50">
                Session in progress
              </h2>
              <p className="text-sm text-craft-gray-400 max-w-sm">
                {sessionPlan.intention}
              </p>
              <p className="text-2xl font-mono text-craft-gray-300 pt-1">
                {formatElapsed(elapsedSeconds)}
              </p>
            </div>
          )}
          <div className="animate-slide-up w-full" style={{ animationDelay: '150ms' }}>
            <SessionPlanView
              plan={sessionPlan}
              onApprove={() => {}}
              onRequestEdit={() => {}}
              editable={false}
            />
          </div>
          <button
            onClick={returnFromSession}
            className="rounded-lg bg-craft-gray-800 hover:bg-craft-gray-700 px-6 py-2.5 text-sm font-medium text-craft-gray-200 transition-colors animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            I&apos;m back
          </button>
        </div>
      )}

      {/* Logging */}
      {phase === 'logging' && (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          {activeHobby && (
            <div className="shrink-0 flex items-center gap-2 pb-3 mb-3 border-b border-craft-gray-800">
              <span className="text-lg">{activeHobby.emoji}</span>
              <span className="text-sm font-medium text-craft-gray-300">
                {activeHobby.name} · Log your session
              </span>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <Chat
              messages={messages}
              onSend={handleLoggingMessage}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      )}

      {/* Artifact Preview */}
      {phase === 'artifact_preview' && (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          {activeHobby && (
            <div className="shrink-0 flex items-center gap-2 pb-3 mb-3 border-b border-craft-gray-800">
              <span className="text-lg">{activeHobby.emoji}</span>
              <span className="text-sm font-medium text-craft-gray-300">
                {activeHobby.name} · Review your artifact
              </span>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="opacity-40 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-craft-blue-950 text-craft-blue-100'
                      : 'bg-craft-gray-800 text-craft-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 pt-4 animate-slide-up">
            <ArtifactPreview
              content={artifactDraft ?? ''}
              isStreaming={artifactDraft !== null && artifactDraft.length === 0}
              onSave={confirmSaveArtifact}
            />
          </div>
        </div>
      )}

      {/* Completed */}
      {phase === 'completed' && activeHobby && (
        <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
          <span className="text-5xl">{activeHobby.emoji}</span>
          <h2 className="text-xl font-semibold text-craft-gray-50">Session saved.</h2>
          <p className="text-sm text-craft-gray-400">Good work tonight.</p>
        </div>
      )}
    </div>
  )
}
