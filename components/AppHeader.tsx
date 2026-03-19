'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Session' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
]

export default function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6
                        bg-craft-gray-900/80 dark:bg-craft-gray-900/80 backdrop-blur-md
                        border-b border-craft-gray-800">
      <span className="text-lg font-bold text-craft-gray-100">CrafterHours</span>
      <nav className="flex gap-4">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'text-craft-pink-400'
                  : 'text-craft-gray-400 hover:text-craft-gray-200'
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
