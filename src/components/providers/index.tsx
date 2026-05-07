'use client'

import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { WagmiProvider } from 'wagmi'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { wagmiConfig } from '@/configs'
import { AccessGuardProvider } from './access-guard-provider'
import { FheProvider } from './fhe-provider'
import { StoreProvider } from './store-provider'

const queryClient = new QueryClient()

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FheProvider>
          <StoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <AccessGuardProvider>
                  {children}
                </AccessGuardProvider>
                <Toaster richColors position="top-center" />
              </TooltipProvider>
            </ThemeProvider>
          </StoreProvider>
        </FheProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
