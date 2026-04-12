'use client'

import type { PropsWithChildren } from 'react'
import { FhevmProvider } from '@liyincode/fhevm-sdk/react'
import { GenericStringInMemoryStorage } from '@liyincode/fhevm-sdk/storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { fhevmConfig, wagmiConfig } from '@/configs'

const queryClient = new QueryClient()

export default function Providers({ children }: PropsWithChildren) {
  const [signatureStorage] = useState(() => new GenericStringInMemoryStorage())

  return (
    <WagmiProvider config={wagmiConfig.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FhevmProvider config={fhevmConfig} storageOverrides={{ signatureStorage }}>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}
          {children}
          {/* </ThemeProvider> */}
        </FhevmProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
