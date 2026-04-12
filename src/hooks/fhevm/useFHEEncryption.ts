'use client'

import { useCallback, useMemo } from 'react'
import type { JsonRpcSigner } from 'ethers'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'
import type { FhevmInstance } from './types'

export type EncryptResult = {
  handles: Uint8Array[]
  inputProof: Uint8Array
}

export const toHex = (value: Uint8Array | string): `0x${string}` => {
  if (typeof value === 'string') {
    return (value.startsWith('0x') ? value : `0x${value}`) as `0x${string}`
  }
  let hex = ''
  for (const byte of value) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return `0x${hex}` as `0x${string}`
}

export const useFHEEncryption = (params: {
  instance: FhevmInstance | undefined
  ethersSigner: JsonRpcSigner | undefined
  contractAddress: `0x${string}` | undefined
}) => {
  const { instance, ethersSigner, contractAddress } = params

  const canEncrypt = useMemo(
    () => Boolean(instance && ethersSigner && contractAddress),
    [instance, ethersSigner, contractAddress],
  )

  const encryptWith = useCallback(async (
    buildFn: (builder: RelayerEncryptedInput) => void,
  ): Promise<EncryptResult | undefined> => {
    if (!instance || !ethersSigner || !contractAddress)
      return undefined

    const userAddress = await ethersSigner.getAddress()
    const input = instance.createEncryptedInput(contractAddress, userAddress) as RelayerEncryptedInput
    buildFn(input)
    return await input.encrypt()
  }, [instance, ethersSigner, contractAddress])

  return {
    canEncrypt,
    encryptWith,
  } as const
}
