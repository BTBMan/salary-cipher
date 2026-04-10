import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import Header from '@/components/Header'
import Providers from '@/components/providers'
import { cn } from '@/utils'
// import { Toaster } from '@/components/ui/sonner'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Salary Cipher',
  description: 'Managing employee salaries and related financial operations',
}

export default function RootLayout({
  children,
}: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', inter.variable)}>
      <body className="">
        <Providers>
          <div className="app">
            {/* <Header /> */}
            <main>
              <div className="mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
        {/* <Toaster richColors /> */}
      </body>
    </html>
  )
}
