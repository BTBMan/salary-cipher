'use client'

import type { WalletClient } from 'viem'
import { Loader } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useChainId, useConnection, useReadContract, useWalletClient, useWriteContractSync } from 'wagmi'
import { Button } from '@/components/ui/button'
import { FheCounter as FheCounterData } from '@/contract-data/fhe-counter'
import { toHex, useFHEEncryption, useFhevm } from '@/hooks/fhevm'
import { toEthersSigner } from '@/utils'

export default function FheCounter() {
  const [loading, setLoading] = useState(false)

  const { address, isConnected } = useConnection()
  const chainId = useChainId()
  const walletClient = useWalletClient()
  const initialMockChains = useMemo(() => ({ 31337: 'http://localhost:8545' }), [])

  const provider = useMemo(() => {
    if (typeof window === 'undefined')
      return undefined

    return (window as any).ethereum
  }, [])

  const signer = useMemo(() => {
    if (!walletClient.data) {
      return undefined
    }

    return toEthersSigner(walletClient.data as WalletClient)
  }, [walletClient.data])

  const { instance, status, error } = useFhevm({
    provider,
    chainId,
    enabled: Boolean(provider && chainId && isConnected),
    initialMockChains,
  })

  const { canEncrypt, encryptWith } = useFHEEncryption({
    instance,
    ethersSigner: signer,
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

  // const {
  //   canDecrypt,
  //   decrypt,
  //   isDecrypting,
  //   message: decMsg,
  //   results,
  // } = useFHEDecrypt({
  //   instance,
  //   ethersSigner: signer,
  //   fhevmDecryptionSignatureStorage,
  //   chainId,
  //   requests,
  // })

  const decryptCount = async () => {
    //
  }

  return (
    <div>
      <div>FheCounter</div>
      <div>FHEVM Status: {status}</div>
      {error && <div>Error: {error.message}</div>}
      <hr />
      <div>Encrypted Count: {data}</div>
      <Button variant="secondary" onClick={decrement} disabled={loading || !canEncrypt || isWriteCounterPending}>
        {isWriteCounterPending && <Loader className="animate-spin" />} Decrease Count -1
      </Button>
      <span>Decrypted Count: 0</span>
      <Button variant="secondary" onClick={increment} disabled={loading || !canEncrypt || isWriteCounterPending}>
        {isWriteCounterPending && <Loader className="animate-spin" />} Increase Count +1
      </Button>
      <Button variant="destructive" onClick={decryptCount}>Decrypt Count</Button>
    </div>
  )
}
