import type { EncryptResult } from '@/libs/fhevm'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'
import { useCallback, useMemo } from 'react'
import { useFHEContext, useWagmiEthers } from '@/hooks'

export function useFHEEncrypt(params: { contractAddress: `0x${string}` | undefined }) {
  const { contractAddress } = params

  const { instance } = useFHEContext()
  const { ethersSigner } = useWagmiEthers()

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
