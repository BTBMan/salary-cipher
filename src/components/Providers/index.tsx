'use client'

import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { WagmiProvider } from 'wagmi'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { wagmiConfig } from '@/configs'
import { FheProvider } from './fhe-provider'

const queryClient = new QueryClient()

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FheProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </TooltipProvider>
          </ThemeProvider>
        </FheProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
