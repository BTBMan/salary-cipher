'use client'

import type { WalletClient } from 'viem'
import { useEncryptedInput, useFhevmInstance, useSignatureStorage, useUserDecrypt } from '@liyincode/fhevm-sdk/react'
import { Loader } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAccount, useChainId, useReadContract, useWalletClient, useWriteContractSync } from 'wagmi'
import { Button } from '@/components/ui/button'
import { FheCounter as FheCounterData } from '@/contract-data/fhe-counter'
import { toEthersSigner } from '@/utils'

export default function FheCounter() {
  const [loading, setLoading] = useState(false)

  const { address } = useAccount()
  const chainId = useChainId()
  const walletClient = useWalletClient()
  const provider = useMemo(() => {
    if (!walletClient.data) {
      return undefined
    }

    return {
      request: (args: { method: string, params?: unknown[] }) => walletClient.data.request(args as any),
    }
  }, [walletClient.data])
  const signer = useMemo(() => {
    if (!walletClient.data) {
      return undefined
    }

    return toEthersSigner(walletClient.data as WalletClient)
  }, [walletClient.data])

  const { instance, status, error } = useFhevmInstance({ chainId, enabled: !!address })
  const signatureStorage = useSignatureStorage()
  const { canEncrypt, encrypt } = useEncryptedInput({
    instance,
    signer,
    contractAddress: FheCounterData.address,
  })

  const getInfo = async () => {
    console.log({
      address,
      chainId,
      walletClient,
      provider,
      status,
      error,
      canEncrypt,
      instance,
    })
  }

  const { data, refetch } = useReadContract({
    abi: FheCounterData.abi,
    address: FheCounterData.address,
    functionName: 'getCount',
    account: address,
  })

  const writeContractSync = useWriteContractSync()

  const increment = async () => {
    setLoading(true)
    const payload = await encrypt((b) => {
      console.log(b)
      return b.add32(1)
    })
    console.log(payload)
    // await writeContractSync.mutate(
    //   {
    //     abi: FheCounterData.abi,
    //     address: FheCounterData.address,
    //     functionName: 'increment',
    //     account: address,
    //     args: [BigInt(1)],
    //   },
    // )
    setLoading(false)
  }

  return (
    <div>
      <div>FheCounter</div>
      <div>Count: 0</div>
      <div>Encrypted: {data}</div>
      <Button variant="secondary" onClick={increment} disabled={loading}>
        {loading && <Loader className="animate-spin" />} Increase Count +1
      </Button>
      <Button variant="secondary">Decrease Count -1</Button>
      <Button variant="secondary" onClick={getInfo}>Get Info</Button>
    </div>
  )
}
