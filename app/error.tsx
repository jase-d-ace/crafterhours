'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold text-craft-gray-100">Something went wrong</h2>
        <p className="text-sm text-craft-gray-400">
          An unexpected error occurred. Try again, and if the problem persists, check the console for details.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-craft-blue-500 px-4 py-2.5 font-medium text-white
                     hover:bg-craft-blue-600 active:bg-craft-blue-700
                     transition-colors duration-150"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
