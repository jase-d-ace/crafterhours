'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Session' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 bg-craft-gray-900/80 backdrop-blur-md border-b border-craft-gray-800">
      <span className="text-lg font-semibold text-craft-gray-50 tracking-tight">
        CrafterHours
      </span>
      <nav className="flex gap-1">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-craft-pink-400 bg-craft-pink-400/10'
                  : 'text-craft-gray-400 hover:text-craft-gray-200 hover:bg-craft-gray-800'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
