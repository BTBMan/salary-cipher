/* eslint-disable react/exhaustive-deps */
import { useEffect, useMemo, useRef } from 'react'
import { useConnection, useWalletClient } from 'wagmi'
import { ethersWrapper } from '../utils'

export function useWagmiEthers(initialMockChains?: Readonly<Record<number, string>>) {
  const { address, isConnected, chain } = useConnection()
  const { data: walletClient } = useWalletClient()

  const chainId = chain?.id ?? walletClient?.chain?.id
  const accounts = address ? [address] : undefined

  const {
    ethersProvider: _ethersProvider,
    ethersReadonlyProvider: _ethersReadonlyProvider,
    ethersSigner: _ethersSigner,
  } = ethersWrapper(walletClient, initialMockChains)

  const ethersProvider = useMemo(() => {
    return _ethersProvider()
  }, [walletClient])

  const ethersReadonlyProvider = useMemo(() => {
    return _ethersReadonlyProvider()
  }, [ethersProvider, initialMockChains, chainId])

  const ethersSigner = useMemo(() => {
    return _ethersSigner()
  }, [walletClient])

  // Stable refs consumers can reuse
  const ropRef = useRef<typeof ethersReadonlyProvider>(ethersReadonlyProvider)
  const chainIdRef = useRef<number | undefined>(chainId)

  useEffect(() => {
    ropRef.current = ethersReadonlyProvider
  }, [ethersReadonlyProvider])

  useEffect(() => {
    chainIdRef.current = chainId
  }, [chainId])

  return {
    chainId,
    accounts,
    address,
    isConnected,
    ethersProvider,
    ethersReadonlyProvider,
    ethersSigner,
    ropRef,
    chainIdRef,
  } as const
}
