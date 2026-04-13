'use client'

import type { EncryptResult, FhevmInstance } from '@/libs/fhevm'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'
import type { ethers } from 'ethers'
import { useCallback, useMemo } from 'react'

export function useFHEEncrypt(params: {
  instance: FhevmInstance | undefined
  ethersSigner: ethers.JsonRpcSigner | undefined
  contractAddress: `0x${string}` | undefined
}) {
  const { instance, ethersSigner, contractAddress } = params

  const canEncrypt = useMemo(
    () => Boolean(instance && ethersSigner && contractAddress),
    [instance, ethersSigner, contractAddress],
  )

  const encryptWith = useCallback(
    async (buildFn: (builder: RelayerEncryptedInput) => void): Promise<EncryptResult | undefined> => {
      if (!instance || !ethersSigner || !contractAddress)
        return undefined

      const userAddress = await ethersSigner.getAddress()
      const input = instance.createEncryptedInput(contractAddress, userAddress) as RelayerEncryptedInput
      buildFn(input)
      const enc = await input.encrypt()
      return enc
    },
    [instance, ethersSigner, contractAddress],
  )

  return {
    canEncrypt,
    encryptWith,
  } as const
}
