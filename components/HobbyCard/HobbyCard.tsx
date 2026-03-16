'use client'

import type { Hobby } from '@/lib/types'

type HobbyCardProps = {
  hobby: Hobby
  lastSession?: string
}

export default function HobbyCard({ hobby, lastSession }: HobbyCardProps) {
  void hobby
  void lastSession
  return (
    <div className="border rounded-lg p-4">
      <p className="text-gray-500">Hobby card — coming soon</p>
    </div>
  )
}
