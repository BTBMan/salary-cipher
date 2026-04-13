'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { FhevmDecryptionSignature } from './FhevmDecryptionSignature'
import type { GenericStringStorage } from './storage'
import type { FhevmInstance } from './types'
import type { JsonRpcSigner } from 'ethers'

export type FHEDecryptRequest = { handle: string, contractAddress: `0x${string}` }

export const useFHEDecrypt = (params: {
  instance: FhevmInstance | undefined
  ethersSigner: JsonRpcSigner | undefined
  fhevmDecryptionSignatureStorage: GenericStringStorage
  chainId: number | undefined
  requests: readonly FHEDecryptRequest[] | undefined
}) => {
  const { instance, ethersSigner, fhevmDecryptionSignatureStorage, chainId, requests } = params

  const [isDecrypting, setIsDecrypting] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Record<string, string | bigint | boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const isDecryptingRef = useRef(isDecrypting)
  const lastReqKeyRef = useRef('')

  const requestsKey = useMemo(() => {
    if (!requests || requests.length === 0)
      return ''
    return JSON.stringify([...requests].sort((a, b) => (a.handle + a.contractAddress).localeCompare(b.handle + b.contractAddress)))
  }, [requests])

  const canDecrypt = useMemo(
    () => Boolean(instance && ethersSigner && requests && requests.length > 0 && !isDecrypting),
    [instance, ethersSigner, requests, isDecrypting],
  )

  const decrypt = useCallback(() => {
    if (isDecryptingRef.current || !instance || !ethersSigner || !requests || requests.length === 0) {
      return
    }

    const thisChainId = chainId
    const thisSigner = ethersSigner
    const thisRequests = requests
    lastReqKeyRef.current = requestsKey
    isDecryptingRef.current = true
    setIsDecrypting(true)
    setMessage('Start decrypt')
    setError(null)

    const run = async () => {
      const isStale = () => thisChainId !== chainId || thisSigner !== ethersSigner || requestsKey !== lastReqKeyRef.current

      try {
        const uniqueAddresses = Array.from(new Set(thisRequests.map(r => r.contractAddress)))
        const signature = await FhevmDecryptionSignature.loadOrSign(
          instance,
          uniqueAddresses,
          ethersSigner,
          fhevmDecryptionSignatureStorage,
        )

        if (!signature) {
          setMessage('Unable to build FHEVM decryption signature')
          setError('SIGNATURE_ERROR: Failed to create decryption signature')
          return
        }

        if (isStale()) {
          setMessage('Ignore FHEVM decryption')
          return
        }

        setMessage('Call FHEVM userDecrypt...')

        try {
          const result = await instance.userDecrypt(
            thisRequests.map(r => ({ handle: r.handle, contractAddress: r.contractAddress })),
            signature.privateKey,
            signature.publicKey,
            signature.signature,
            signature.contractAddresses,
            signature.userAddress,
            signature.startTimestamp,
            signature.durationDays,
          )

          if (isStale()) {
            setMessage('Ignore FHEVM decryption')
            return
          }

          setResults(result)
          setMessage('FHEVM userDecrypt completed!')
        }
        catch (nextError) {
          const err = nextError as { name?: string, message?: string }
          setError(`${err.name ?? 'DECRYPT_ERROR'}: ${err.message ?? 'Decryption failed'}`)
          setMessage('FHEVM userDecrypt failed')
        }
      }
      catch (nextError) {
        const err = nextError as { name?: string, message?: string }
        setError(`${err.name ?? 'UNKNOWN_ERROR'}: ${err.message ?? 'Unknown error'}`)
        setMessage('FHEVM decryption errored')
      }
      finally {
        isDecryptingRef.current = false
        setIsDecrypting(false)
        lastReqKeyRef.current = requestsKey
      }
    }

    void run()
  }, [instance, ethersSigner, fhevmDecryptionSignatureStorage, chainId, requests, requestsKey])

  return { canDecrypt, decrypt, isDecrypting, message, results, error, setMessage, setError } as const
}
