'use client'

import { useState } from 'react'

type ArtifactPreviewProps = {
  content: string
  isStreaming: boolean
  onSave: (content: string) => void
}

export default function ArtifactPreview({ content, isStreaming, onSave }: ArtifactPreviewProps) {
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(content)

  // Keep edited in sync while streaming, unless user has started editing
  if (!editing && edited !== content) {
    setEdited(content)
  }

  return (
    <div className="rounded-xl bg-craft-gray-900 border border-craft-gray-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-craft-gray-400 uppercase tracking-wide">
          Artifact draft
        </span>
        {!isStreaming && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-craft-gray-500 hover:text-craft-gray-300 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          className="w-full min-h-48 bg-craft-gray-800 text-craft-gray-100 text-sm leading-relaxed rounded-lg p-3 resize-y font-mono focus:outline-none focus:ring-1 focus:ring-craft-blue-600"
        />
      ) : (
        <pre className="text-sm text-craft-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
          {content || (isStreaming ? '…' : '')}
        </pre>
      )}

      {!isStreaming && (
        <div className="flex gap-3 pt-1">
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-craft-gray-500 hover:text-craft-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onSave(editing ? edited : content)}
            className="flex-1 rounded-lg bg-craft-blue-600 hover:bg-craft-blue-500 text-white text-sm font-medium py-2.5 transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
