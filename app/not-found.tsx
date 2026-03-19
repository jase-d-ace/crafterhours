import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold text-craft-gray-100">Page not found</h2>
        <p className="text-sm text-craft-gray-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-craft-blue-500 px-4 py-2.5 font-medium text-white
                     hover:bg-craft-blue-600 active:bg-craft-blue-700
                     transition-colors duration-150"
        >
          Back to session
        </Link>
      </div>
    </main>
  )
}
