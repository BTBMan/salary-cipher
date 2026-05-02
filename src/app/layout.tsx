import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/utils'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-heading' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Salary Cipher: Secure HR Payroll',
  description: 'Managing employee salaries and related financial operations with Fully Homomorphic Encryption (FHE)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', inter.variable, manrope.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
