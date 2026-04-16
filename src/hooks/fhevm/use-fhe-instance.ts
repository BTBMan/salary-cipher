/* eslint-disable react/set-state-in-effect */
import type { FhevmInstance } from '@/libs/fhevm'
import type { ethers } from 'ethers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useConnection } from 'wagmi'
import { createFhevmInstance } from '@/libs/fhevm'

function _assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    const m = message ? `Assertion failed: ${message}` : `Assertion failed.`
    throw new Error(m)
  }
}

export type FhevmGoState = 'idle' | 'loading' | 'ready' | 'error'

export function useFHEInstance(parameters?: {
  enabled?: boolean
  initialMockChains?: Readonly<Record<number, string>>
}): {
  instance: FhevmInstance | undefined
  refresh: () => void
  error: Error | undefined
  status: FhevmGoState
} {
  const { initialMockChains = {}, enabled = true } = parameters || {}

  const { isConnected, chainId } = useConnection()

  const provider = useMemo(() => {
    if (typeof window === 'undefined')
      return undefined

    return (window as any).ethereum
  }, [])

  const _enabled = useMemo(() => {
    return Boolean(provider && chainId && isConnected && enabled)
  }, [chainId, isConnected, enabled, provider])

  const [instance, setInstance] = useState<FhevmInstance | undefined>(
    undefined,
  )
  const [status, setStatus] = useState<FhevmGoState>('idle')
  const [error, setError] = useState<Error | undefined>(undefined)
  const [_isRunning, setIsRunning] = useState<boolean>(_enabled)
  const [_providerChanged, setProviderChanged] = useState<number>(0)
  const _abortControllerRef = useRef<AbortController | null>(null)
  const _providerRef = useRef<string | ethers.Eip1193Provider | undefined>(
    provider,
  )
  const _chainIdRef = useRef<number | undefined>(chainId)
  const _mockChainsRef = useRef<Record<number, string> | undefined>(
    initialMockChains as any,
  )

  const refresh = useCallback(() => {
    if (_abortControllerRef.current) {
      _providerRef.current = undefined
      _chainIdRef.current = undefined

      _abortControllerRef.current.abort()
      _abortControllerRef.current = null
    }

    _providerRef.current = provider
    _chainIdRef.current = chainId

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
    setIsRunning(_enabled)
  }, [_enabled])

  useEffect(() => {
    if (_isRunning === false) {
      if (_abortControllerRef.current) {
        _abortControllerRef.current.abort()
        _abortControllerRef.current = null
      }
      setInstance(undefined)
      setError(undefined)
      setStatus('idle')
      return
    }

    if (_isRunning === true) {
      if (_providerRef.current === undefined) {
        setInstance(undefined)
        setError(undefined)
        setStatus('idle')
        return
      }

      if (!_abortControllerRef.current) {
        _abortControllerRef.current = new AbortController()
      }

      _assert(
        !_abortControllerRef.current.signal.aborted,
        '!controllerRef.current.signal.aborted',
      )

      setStatus('loading')
      setError(undefined)

      const thisSignal = _abortControllerRef.current.signal
      const thisProvider = _providerRef.current
      const thisRpcUrlsByChainId = _mockChainsRef.current as any

      createFhevmInstance({
        signal: thisSignal,
        provider: thisProvider as any,
        mockChains: thisRpcUrlsByChainId as any,
        onStatusChange: (_s) => {
          // console.log(`[useFhevm] createFhevmInstance status changed: ${s}`)
        },
      })
        .then((i) => {
          if (thisSignal.aborted)
            return
          _assert(
            thisProvider === _providerRef.current,
            'thisProvider === _providerRef.current',
          )

          setInstance(i)
          setError(undefined)
          setStatus('ready')
        })
        .catch((e) => {
          if (thisSignal.aborted)
            return

          _assert(
            thisProvider === _providerRef.current,
            'thisProvider === _providerRef.current',
          )

          setInstance(undefined)
          setError(e as any)
          setStatus('error')
        })
    }
  }, [_isRunning, _providerChanged])

  return { instance, refresh, error, status }
}
