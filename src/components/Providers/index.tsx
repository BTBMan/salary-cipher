'use client'

import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/configs'
import { FheProvider } from './fhe-provider'

const queryClient = new QueryClient()

export default function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FheProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </FheProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
