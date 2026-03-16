'use client'

import type { Artifact } from '@/lib/types'

type ArtifactPreviewProps = {
  artifact: Artifact
  onSave: () => void
}

export default function ArtifactPreview({ artifact, onSave }: ArtifactPreviewProps) {
  void artifact
  void onSave
  return (
    <div>
      <p className="text-gray-500">Artifact preview — coming soon</p>
    </div>
  )
}
