import type { Metadata } from 'next'
import './globals.css'
import AppHeader from '@/components/AppHeader'

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
        {children}
      </body>
    </html>
  )
}
