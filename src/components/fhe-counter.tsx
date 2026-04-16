'use client'

import { Loader } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toHex, zeroAddress } from 'viem'
import { useConnection, useReadContract, useWriteContractSync } from 'wagmi'
import { Button } from '@/components/ui/button'
import { FheCounter as FheCounterData } from '@/contract-data/fhe-counter'
import { useFHEDecrypt, useFHEEncrypt, useFHEInstance } from '@/hooks/fhevm'

export default function FheCounter() {
  const [loading, setLoading] = useState(false)

  const { address } = useConnection()

  const { instance, status, error } = useFHEInstance()

  const { canEncrypt, encryptWith } = useFHEEncrypt({
    instance,
    contractAddress: FheCounterData.address,
  })

  const { data, refetch } = useReadContract({
    abi: FheCounterData.abi,
    address: FheCounterData.address,
    functionName: 'getCount',
    account: address,
  })

  const { mutate: writeCounter, isPending: isWriteCounterPending, isSuccess: isWriteCounterSuccess } = useWriteContractSync()
  useEffect(() => {
    if (isWriteCounterSuccess) {
      refetch()
    }
  // eslint-disable-next-line react/exhaustive-deps
  }, [isWriteCounterSuccess])

  const increment = async () => {
    setLoading(true)
    try {
      const payload = await encryptWith(builder => builder.add32(1))
      if (!payload || !address) {
        return
      }

      await writeCounter({
        abi: FheCounterData.abi,
        address: FheCounterData.address,
        functionName: 'increment',
        account: address,
        args: [toHex(payload.handles[0]), toHex(payload.inputProof)],
      })
    }
    finally {
      setLoading(false)
    }
  }

  const decrement = async () => {
    setLoading(true)
    try {
      const payload = await encryptWith(builder => builder.add32(1))
      if (!payload || !address) {
        return
      }

      await writeCounter({
        abi: FheCounterData.abi,
        address: FheCounterData.address,
        functionName: 'decrement',
        account: address,
        args: [toHex(payload.handles[0]), toHex(payload.inputProof)],
      })
    }
    finally {
      setLoading(false)
    }
  }

  const requests = useMemo(() => {
    if (!data || data === zeroAddress) {
      return undefined
    }
    return [{ handle: data as string, contractAddress: FheCounterData.address }] as const
  }, [data])

  const {
    canDecrypt,
    decrypt: decryptCount,
    isDecrypting,
    message: decryptMessage,
    results,
    error: decryptError,
  } = useFHEDecrypt({
    instance,
    requests,
  })

  const decryptedCount = useMemo(() => {
    if (!data) {
      return undefined
    }
    return results[data as string]
  }, [data, results])

  return (
    <div>
      <div>FheCounter</div>
      <div>FHEVM Status: {status}</div>
      <div>Error: {error?.message}</div>
      <div>Decrypt Error: {decryptError}</div>
      <div>Decrypt Message: {decryptMessage}</div>
      <hr />
      <div>Encrypted Count: {data}</div>
      <Button variant="secondary" onClick={decrement} disabled={loading || !canEncrypt || isWriteCounterPending}>
        {isWriteCounterPending && <Loader className="animate-spin" />} Decrease Count -1
      </Button>
      <span>Decrypted Count: {decryptedCount !== undefined ? String(decryptedCount) : '***'}</span>
      <Button variant="secondary" onClick={increment} disabled={loading || !canEncrypt || isWriteCounterPending}>
        {isWriteCounterPending && <Loader className="animate-spin" />} Increase Count +1
      </Button>
      <Button variant="destructive" onClick={decryptCount} disabled={!canDecrypt || isDecrypting}>
        {isDecrypting && <Loader className="animate-spin" />} Decrypt Count
      </Button>
    </div>
  )
}
