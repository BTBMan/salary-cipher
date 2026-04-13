'use client'

import type { GenericStringStorage } from '@/libs/fhevm'
import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/configs'
import { FHEContext } from '@/contexts'
import { GenericStringInMemoryStorage } from '@/libs/fhevm'

const queryClient = new QueryClient()

export default function Providers({ children }: PropsWithChildren) {
  const [storage] = useState<GenericStringStorage>(() => new GenericStringInMemoryStorage())

  return (
    <WagmiProvider config={wagmiConfig.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FHEContext value={{ storage }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </FHEContext>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
