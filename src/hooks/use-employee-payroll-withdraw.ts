'use client'

import type { CompanySummary, SettlementAssetOption } from '@/contexts'
import type { Address, Hash, Hex, TransactionReceipt } from 'viem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { decodeEventLog, formatUnits } from 'viem'
import { useConnection, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { ERC20 } from '@/contract-data/erc20'
import { ERC7984Wrapper } from '@/contract-data/erc7984-wrapper'
import { useFHEContext } from './fhevm'

interface ReceiptWaiter {
  hash: Hash
  resolve: (receipt: TransactionReceipt) => void
  reject: (error: Error) => void
}

interface DecodedEventLog {
  eventName?: string
  args?: unknown
}

interface UnwrapRequestData {
  unwrapAmountHandle: Hex
  unwrapRequestId: Hex
}

const DECIMAL_STRING_REGEX = /^\d+$/

function isDecimalValue(value: unknown): value is string {
  return typeof value === 'string' && DECIMAL_STRING_REGEX.test(value)
}

function toUint64Amount(value: unknown) {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value)
  }
  if (isDecimalValue(value)) {
    return BigInt(value)
  }
  return null
}

function getPublicDecryptClearValue(clearValues: Record<string, unknown>, handle: Hex) {
  return clearValues[handle] ?? clearValues[handle.toLowerCase()] ?? clearValues[handle.toUpperCase()]
}

function getUnwrapRequestData(receipt: TransactionReceipt, settlementToken: Address): UnwrapRequestData | null {
  const settlementTokenAddress = settlementToken.toLowerCase()

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== settlementTokenAddress) {
      continue
    }

    try {
      const decoded = decodeEventLog({
        abi: ERC7984Wrapper.abi,
        data: log.data,
        topics: log.topics,
      }) as DecodedEventLog

      if (decoded.eventName !== 'UnwrapRequested') {
        continue
      }

      const args = decoded.args as { amount?: Hex, unwrapRequestId?: Hex } | undefined
      if (args?.amount && args.unwrapRequestId) {
        return {
          unwrapAmountHandle: args.amount,
          unwrapRequestId: args.unwrapRequestId,
        }
      }
    }
    catch {
      // Ignore unrelated logs emitted by the same token contract.
    }
  }

  return null
}

export function useEmployeePayrollWithdraw({
  encryptedBalanceHandle,
  onWithdrawn,
  payoutWallet,
  selectedCompany,
  selectedSettlementAsset,
}: {
  encryptedBalanceHandle: Hex | null
  onWithdrawn?: () => Promise<void> | void
  payoutWallet: Address | null | undefined
  selectedCompany: CompanySummary | null
  selectedSettlementAsset: SettlementAssetOption | null | undefined
}) {
  const { address } = useConnection()
  const { instance } = useFHEContext()
  const { mutateAsync } = useWriteContract()
  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [isWithdrawingEncryptedSalary, setIsWithdrawingEncryptedSalary] = useState(false)
  const canUsePayoutWallet = Boolean(
    address && payoutWallet && payoutWallet.toLowerCase() === address.toLowerCase(),
  )

  const receiptQuery = useWaitForTransactionReceipt({
    hash: receiptHash,
    query: {
      enabled: Boolean(receiptHash),
    },
  })

  useEffect(() => {
    if (!receiptQuery.data || !receiptWaiterRef.current) {
      return
    }

    const waiter = receiptWaiterRef.current
    if (waiter.hash.toLowerCase() !== receiptQuery.data.transactionHash.toLowerCase()) {
      return
    }

    receiptWaiterRef.current = null
    waiter.resolve(receiptQuery.data)
  }, [receiptQuery.data])

  useEffect(() => {
    if (!receiptQuery.error || !receiptWaiterRef.current) {
      return
    }

    const waiter = receiptWaiterRef.current
    receiptWaiterRef.current = null
    waiter.reject(receiptQuery.error)
  }, [receiptQuery.error])

  useEffect(() => {
    return () => {
      receiptWaiterRef.current?.reject(new Error('Transaction receipt wait was cancelled.'))
      receiptWaiterRef.current = null
    }
  }, [])

  const waitForReceipt = useCallback((hash: Hash) => {
    if (receiptWaiterRef.current) {
      return Promise.reject(new Error('Another transaction receipt is already pending.'))
    }

    return new Promise<TransactionReceipt>((resolve, reject) => {
      receiptWaiterRef.current = {
        hash,
        resolve,
        reject,
      }
      setReceiptHash(hash)
    })
  }, [])

  const {
    data: underlyingBalanceResult,
    refetch: refetchUnderlyingBalance,
  } = useReadContract({
    abi: ERC20.abi,
    address: selectedSettlementAsset?.underlyingToken as Address | undefined,
    functionName: 'balanceOf',
    args: payoutWallet ? [payoutWallet] : undefined,
    query: {
      enabled: Boolean(selectedSettlementAsset?.underlyingToken && payoutWallet),
    },
  })

  const underlyingBalance = useMemo(() => {
    return typeof underlyingBalanceResult === 'bigint'
      ? formatUnits(underlyingBalanceResult, selectedSettlementAsset?.decimals ?? 6)
      : null
  }, [selectedSettlementAsset?.decimals, underlyingBalanceResult])

  const withdrawEncryptedSalary = useCallback(async () => {
    if (!address || !selectedCompany || !selectedSettlementAsset || !payoutWallet || !encryptedBalanceHandle) {
      toast.error('Wallet, company, token, or encrypted balance is not ready.')
      return false
    }
    if (!canUsePayoutWallet) {
      toast.error('Please connect the payout wallet to withdraw this encrypted salary.')
      return false
    }
    if (!instance) {
      toast.error('FHEVM is not ready.')
      return false
    }

    setIsWithdrawingEncryptedSalary(true)

    try {
      const settlementToken = selectedSettlementAsset.settlementToken as Address
      const unwrapHash = await mutateAsync({
        abi: ERC7984Wrapper.abi,
        address: settlementToken,
        functionName: 'unwrap',
        args: [payoutWallet, payoutWallet, encryptedBalanceHandle],
        account: address,
      })
      const unwrapReceipt = await waitForReceipt(unwrapHash)
      const unwrapRequestData = getUnwrapRequestData(unwrapReceipt, settlementToken)
      if (!unwrapRequestData) {
        throw new Error('Unable to locate unwrap request data.')
      }

      const decrypted = await instance.publicDecrypt([unwrapRequestData.unwrapAmountHandle])
      const clearAmount = toUint64Amount(getPublicDecryptClearValue(
        decrypted.clearValues,
        unwrapRequestData.unwrapAmountHandle,
      ))
      if (clearAmount === null) {
        throw new Error('Unable to decrypt unwrap amount.')
      }

      const finalizeHash = await mutateAsync({
        abi: ERC7984Wrapper.abi,
        address: settlementToken,
        functionName: 'finalizeUnwrap',
        args: [unwrapRequestData.unwrapRequestId, clearAmount, decrypted.decryptionProof],
        account: address,
      })
      await waitForReceipt(finalizeHash)

      await Promise.all([
        refetchUnderlyingBalance(),
        onWithdrawn?.(),
      ])
      toast.success('Encrypted salary withdrawn.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to withdraw encrypted salary.')
      return false
    }
    finally {
      setIsWithdrawingEncryptedSalary(false)
    }
  }, [
    address,
    canUsePayoutWallet,
    encryptedBalanceHandle,
    instance,
    mutateAsync,
    onWithdrawn,
    payoutWallet,
    refetchUnderlyingBalance,
    selectedCompany,
    selectedSettlementAsset,
    waitForReceipt,
  ])

  return {
    canUsePayoutWallet,
    isWithdrawingEncryptedSalary,
    underlyingBalance,
    refetchUnderlyingBalance,
    withdrawEncryptedSalary,
  } as const
}
