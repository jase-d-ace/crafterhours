import type { Metadata } from 'next'
import './globals.css'
import { AppHeader } from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'CrafterHours',
  description: 'Evening hobby coaching app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppHeader />
        <main className="mx-auto max-w-[640px] px-4 pt-16 pb-4 min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </body>
    </html>
  )
}
