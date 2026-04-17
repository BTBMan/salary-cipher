'use client'

import { Loader, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toHex, zeroAddress } from 'viem'
import { useConnection, useReadContract, useWriteContractSync } from 'wagmi'
import { Button } from '@/components/ui/button'
import { FheCounter as FheCounterData } from '@/contract-data/fhe-counter'
import { useFHEContext, useFHEDecrypt, useFHEEncrypt } from '@/hooks'
import { cn } from '@/utils'

export default function FheCounter() {
  const [loading, setLoading] = useState(false)

  const { address } = useConnection()

  const { status, error } = useFHEContext()

  const { canEncrypt, encryptWith } = useFHEEncrypt({
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
    results,
  } = useFHEDecrypt({
    requests,
  })

  const decryptedCount = useMemo(() => {
    if (!data) {
      return undefined
    }
    return results[data as string]
  }, [data, results])

  return (
    <Card className="bg-surface-container border-none shadow-none max-w-md w-full mx-auto overflow-hidden no-border-section">
      <CardHeader className="bg-primary/5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="size-4 text-primary" />
          <CardTitle className="text-sm font-heading font-bold uppercase tracking-widest text-primary">FHE Proof of Concept</CardTitle>
        </div>
        <CardDescription className="text-[10px]">Verifying encrypted computation on the FHEVM.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-surface-high/30 border border-border/30">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">FHEVM Status</span>
            <div className="flex items-center gap-2">
              <div className={cn('size-1.5 rounded-full', status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500')} />
              <span className="text-xs font-bold capitalize">{status}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-surface-high/30 border border-border/30">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">On-Chain Value</span>
            <div className="text-xs font-mono truncate">{data ? `${data.slice(0, 8)}...` : 'None'}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Decrypted Counter</span>
          <div className="text-5xl font-bold font-mono text-foreground">
            {isDecrypting ? '...' : (decryptedCount !== undefined ? String(decryptedCount) : <div className="blur-sm opacity-50">888</div>)}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={decrement}
              disabled={loading || !canEncrypt || isWriteCounterPending}
              className="flex-1 bg-surface-high border-border/50 font-bold h-11"
            >
              {isWriteCounterPending && <Loader className="size-4 mr-2 animate-spin" />}
              -1
            </Button>
            <Button
              onClick={increment}
              disabled={loading || !canEncrypt || isWriteCounterPending}
              className="flex-[2] primary-gradient border-none font-bold h-11"
            >
              {isWriteCounterPending && <Loader className="size-4 mr-2 animate-spin" />}
              Increment Cipher
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={decryptCount}
            disabled={!canDecrypt || isDecrypting}
            className="w-full border-tertiary/30 bg-tertiary/5 text-tertiary hover:bg-tertiary/10 h-11 font-bold"
          >
            {isDecrypting && <Loader className="size-4 mr-2 animate-spin" />}
            Decrypt with Multi-Sig
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-[10px] text-destructive flex gap-2">
            <ShieldAlert className="size-3 shrink-0" />
            <span>{error.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ShieldAlert({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
  )
}

function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-sm', className)}>{children}</div>
}

function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
}

function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)}>{children}</h3>
}

function CardDescription({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
}

function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>
}
