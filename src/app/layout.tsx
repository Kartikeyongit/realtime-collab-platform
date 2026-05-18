import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/ui/navigation'
import { ShortcutsDialog } from '@/components/ui/ShortcutsDialog'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'CollabDocs - Real-Time Collaboration',
  description: 'Create and edit documents together in real-time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className={`${inter.className}`} style={{ background: '#fdfbf7', color: '#1c1917', minHeight: '100vh' }}>
        <Providers>
          <Navigation />
          {children}
          <ShortcutsDialog />
        </Providers>
      </body>
    </html>
  )
}
