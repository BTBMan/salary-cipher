'use client'

import type { FhevmInstance } from './types'
import type { Eip1193Provider } from 'ethers'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createFhevmInstance } from './internal/fhevm'

export type FhevmGoState = 'idle' | 'loading' | 'ready' | 'error'

export function useFhevm(parameters: {
  provider: string | Eip1193Provider | undefined
  chainId: number | undefined
  enabled?: boolean
  initialMockChains?: Readonly<Record<number, string>>
}): {
  instance: FhevmInstance | undefined
  refresh: () => void
  error: Error | undefined
  status: FhevmGoState
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters

  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined)
  const [status, setStatus] = useState<FhevmGoState>('idle')
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isRunning, setIsRunning] = useState<boolean>(enabled)
  const [providerChanged, setProviderChanged] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const providerRef = useRef<string | Eip1193Provider | undefined>(provider)
  const mockChainsRef = useRef<Record<number, string> | undefined>(initialMockChains as Record<number, string> | undefined)

  const refresh = useCallback(() => {
    if (abortControllerRef.current) {
      providerRef.current = undefined
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    providerRef.current = provider
    setInstance(undefined)
    setError(undefined)
    setStatus('idle')

    if (provider !== undefined) {
      setProviderChanged(prev => prev + 1)
    }
  }, [provider, chainId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    setIsRunning(enabled)
  }, [enabled])

  useEffect(() => {
    if (!isRunning) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setInstance(undefined)
      setError(undefined)
      setStatus('idle')
      return
    }

    if (!providerRef.current) {
      setInstance(undefined)
      setError(undefined)
      setStatus('idle')
      return
    }

    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController()
    }

    setStatus('loading')
    setError(undefined)

    const thisSignal = abortControllerRef.current.signal
    const thisProvider = providerRef.current
    const thisMockChains = mockChainsRef.current

    createFhevmInstance({
      signal: thisSignal,
      provider: thisProvider,
      mockChains: thisMockChains,
      onStatusChange: s => console.log(`[useFhevm] createFhevmInstance status changed: ${s}`),
    })
      .then((nextInstance) => {
        if (thisSignal.aborted || thisProvider !== providerRef.current)
          return
        setInstance(nextInstance)
        setError(undefined)
        setStatus('ready')
      })
      .catch((nextError) => {
        if (thisSignal.aborted || thisProvider !== providerRef.current)
          return
        setInstance(undefined)
        setError(nextError as Error)
        setStatus('error')
      })
  }, [isRunning, providerChanged])

  return { instance, refresh, error, status }
}
