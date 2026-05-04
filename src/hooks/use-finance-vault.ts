'use client'

import type { CompanySummary } from '@/contexts'
import type { Address, Hash, Hex, TransactionReceipt } from 'viem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { decodeEventLog, formatUnits, parseUnits, zeroAddress, zeroHash } from 'viem'
import { useConnection, useContractEvents, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { CompanyTreasuryVault } from '@/contract-data/company-treasury-vault'
import { ERC20 } from '@/contract-data/erc20'
import { ERC7984Wrapper } from '@/contract-data/erc7984-wrapper'
import { useFHEContext } from './fhevm'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useStoreContext } from './use-store-context'

interface ReceiptWaiter {
  hash: Hash
  resolve: (receipt: TransactionReceipt) => void
  reject: (error: Error) => void
}

interface VaultEventLog {
  args: {
    amount?: bigint
    executedAt?: bigint
    from?: Address
    to?: Address
    unwrapRequestId?: Hex
  }
  blockNumber?: bigint
  logIndex?: number
  transactionHash: Hex
}

interface ConfidentialTransferLog {
  args: {
    amount?: Hex
    to?: Address
  }
  blockNumber?: bigint
  logIndex?: number
  transactionHash: Hex
}

interface DecodedEventLog {
  eventName?: string
  args?: unknown
}

export interface FinanceTransactionRow {
  amount: string | null
  amountHandle: Hex | null
  blockNumber: bigint
  executedAt: number | null
  hash: Hex
  logIndex: number
  requestId: Hex | null
  type: 'deposit' | 'payroll' | 'refund-request' | 'wrap'
}

const DECIMAL_STRING_REGEX = /^\d+$/

function toTokenAmount(value: bigint | string | boolean | undefined, decimals: number) {
  if (typeof value === 'bigint') {
    return formatUnits(value, decimals)
  }
  if (typeof value === 'string' && DECIMAL_STRING_REGEX.test(value)) {
    return formatUnits(BigInt(value), decimals)
  }
  return null
}

function isActiveHandle(value: unknown): value is Hex {
  return typeof value === 'string' && value !== '0x' && value !== zeroAddress && value !== zeroHash
}

function getSortableBlockNumber(log: VaultEventLog) {
  return log.blockNumber ?? 0n
}

function getSortableLogIndex(log: VaultEventLog) {
  return log.logIndex ?? 0
}

function normalizeHandle(value: unknown): Hex | null {
  return isActiveHandle(value) ? value : null
}

function toUint64Amount(value: unknown) {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value)
  }
  if (typeof value === 'string' && DECIMAL_STRING_REGEX.test(value)) {
    return BigInt(value)
  }
  return null
}

function getPublicDecryptClearValue(clearValues: Record<string, unknown>, handle: Hex) {
  return clearValues[handle] ?? clearValues[handle.toLowerCase()] ?? clearValues[handle.toUpperCase()]
}

function getDecryptedValue(results: Record<string, string | bigint | boolean>, handle: Hex) {
  return results[handle] ?? results[handle.toLowerCase()] ?? results[handle.toUpperCase()]
}

function getTransferKey(transactionHash: string, recipient: Address) {
  return `${transactionHash.toLowerCase()}-${recipient.toLowerCase()}`
}

function getRefundUnwrapData(receipt: TransactionReceipt, treasuryVault: Address, settlementToken: Address) {
  let unwrapRequestId: Hex | null = null
  let unwrapAmountHandle: Hex | null = null
  const treasuryVaultAddress = treasuryVault.toLowerCase()
  const settlementTokenAddress = settlementToken.toLowerCase()

  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() === treasuryVaultAddress) {
        const decoded = decodeEventLog({
          abi: CompanyTreasuryVault.abi,
          data: log.data,
          topics: log.topics,
        }) as DecodedEventLog

        if (decoded.eventName === 'UnderlyingUnwrapRequested') {
          const args = decoded.args as { unwrapRequestId?: Hex } | undefined
          unwrapRequestId = args?.unwrapRequestId ?? null
        }
      }

      if (log.address.toLowerCase() === settlementTokenAddress) {
        const decoded = decodeEventLog({
          abi: ERC7984Wrapper.abi,
          data: log.data,
          topics: log.topics,
        }) as DecodedEventLog

        if (decoded.eventName === 'UnwrapRequested') {
          const args = decoded.args as { amount?: Hex } | undefined
          unwrapAmountHandle = normalizeHandle(args?.amount)
        }
      }
    }
    catch {
      // Ignore unrelated logs emitted by contracts that share the same transaction.
    }
  }

  return { unwrapRequestId, unwrapAmountHandle }
}

export function useFinanceVault(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const { instance } = useFHEContext()
  const { settlementAssets } = useStoreContext()
  const { mutateAsync } = useWriteContract()
  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawingWrapped, setIsWithdrawingWrapped] = useState(false)
  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null

  const selectedSettlementAsset = useMemo(() => {
    if (!selectedCompany) {
      return null
    }

    return settlementAssets.find(asset => asset.value === selectedCompany.settlementAsset) ?? null
  }, [selectedCompany, settlementAssets])

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
    data: treasuryVaultResult,
    refetch: refetchTreasuryVault,
  } = useReadContract({
    abi: CompanyRegistry.abi,
    address: CompanyRegistry.address,
    functionName: 'getTreasuryVault',
    args: companyId ? [companyId] : undefined,
    query: {
      enabled: Boolean(companyId),
    },
  })

  const treasuryVault = useMemo(() => {
    return typeof treasuryVaultResult === 'string' ? treasuryVaultResult as Address : zeroAddress
  }, [treasuryVaultResult])
  const treasuryVaultConfigured = treasuryVault !== zeroAddress

  const balanceContracts = useMemo((): any[] => {
    if (!selectedSettlementAsset || !address || !treasuryVaultConfigured) {
      return []
    }

    return [
      {
        abi: ERC20.abi,
        address: selectedSettlementAsset.underlyingToken as Address,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        abi: ERC20.abi,
        address: selectedSettlementAsset.underlyingToken as Address,
        functionName: 'balanceOf',
        args: [treasuryVault],
      },
    ]
  }, [address, selectedSettlementAsset, treasuryVault, treasuryVaultConfigured])

  const {
    data: balanceResults,
    isLoading: isLoadingPublicBalances,
    refetch: refetchPublicBalances,
  } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: balanceContracts.length > 0,
    },
  })

  const {
    data: vaultConfidentialBalanceResult,
    isLoading: isLoadingConfidentialBalance,
    refetch: refetchConfidentialBalance,
  } = useReadContract({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    functionName: 'confidentialBalanceOf',
    args: treasuryVaultConfigured ? [treasuryVault] : undefined,
    query: {
      enabled: Boolean(selectedSettlementAsset?.settlementToken && treasuryVaultConfigured),
    },
  })

  const vaultConfidentialBalanceHandle = useMemo(() => {
    return isActiveHandle(vaultConfidentialBalanceResult) ? vaultConfidentialBalanceResult : null
  }, [vaultConfidentialBalanceResult])

  const vaultBalanceDecrypt = useFHEDecrypt({
    requests: vaultConfidentialBalanceHandle && selectedSettlementAsset?.settlementToken
      ? [{
          contractAddress: selectedSettlementAsset.settlementToken as Address,
          handle: vaultConfidentialBalanceHandle,
        }]
      : undefined,
  })

  const ownerUnderlyingBalance = useMemo(() => {
    const result = balanceResults?.[0]
    return result?.status === 'success' && typeof result.result === 'bigint'
      ? formatUnits(result.result, selectedSettlementAsset?.decimals ?? 6)
      : null
  }, [balanceResults, selectedSettlementAsset?.decimals])

  const vaultUnusedUnderlyingBalance = useMemo(() => {
    const result = balanceResults?.[1]
    return result?.status === 'success' && typeof result.result === 'bigint'
      ? formatUnits(result.result, selectedSettlementAsset?.decimals ?? 6)
      : null
  }, [balanceResults, selectedSettlementAsset?.decimals])

  const vaultConfidentialBalance = useMemo(() => {
    if (!vaultConfidentialBalanceHandle) {
      return null
    }

    return toTokenAmount(
      vaultBalanceDecrypt.results[vaultConfidentialBalanceHandle],
      selectedSettlementAsset?.decimals ?? 6,
    )
  }, [selectedSettlementAsset?.decimals, vaultBalanceDecrypt.results, vaultConfidentialBalanceHandle])

  const eventArgs = useMemo(() => {
    return companyId ? { companyId } : undefined
  }, [companyId])

  const {
    data: depositAndWrapLogs,
    refetch: refetchDepositAndWrapLogs,
  } = useContractEvents({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault : undefined,
    eventName: 'UnderlyingDepositedAndWrapped',
    args: eventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: treasuryVaultConfigured,
    },
  })

  const {
    data: payrollLogs,
    refetch: refetchPayrollLogs,
  } = useContractEvents({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault : undefined,
    eventName: 'PayrollTransferred',
    args: eventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: treasuryVaultConfigured,
    },
  })

  const transferEventArgs = useMemo(() => {
    return treasuryVaultConfigured ? { from: treasuryVault } : undefined
  }, [treasuryVault, treasuryVaultConfigured])

  const {
    data: payrollTransferLogs,
    refetch: refetchPayrollTransferLogs,
  } = useContractEvents({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    eventName: 'ConfidentialTransfer',
    args: transferEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: Boolean(selectedSettlementAsset?.settlementToken && treasuryVaultConfigured),
    },
  })

  const {
    data: refundRequestLogs,
    refetch: refetchRefundRequestLogs,
  } = useContractEvents({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault : undefined,
    eventName: 'UnderlyingUnwrapRequested',
    args: eventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: treasuryVaultConfigured,
    },
  })

  const refetchFinanceData = useCallback(async () => {
    await Promise.all([
      refetchTreasuryVault(),
      refetchPublicBalances(),
      refetchConfidentialBalance(),
      refetchDepositAndWrapLogs(),
      refetchPayrollLogs(),
      refetchPayrollTransferLogs(),
      refetchRefundRequestLogs(),
    ])
  }, [
    refetchConfidentialBalance,
    refetchDepositAndWrapLogs,
    refetchPayrollLogs,
    refetchPayrollTransferLogs,
    refetchPublicBalances,
    refetchRefundRequestLogs,
    refetchTreasuryVault,
  ])

  useWatchContractEvent({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault : undefined,
    eventName: 'UnderlyingDepositedAndWrapped',
    args: eventArgs,
    enabled: treasuryVaultConfigured,
    onLogs: () => {
      void refetchFinanceData()
    },
  })

  useWatchContractEvent({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault : undefined,
    eventName: 'PayrollTransferred',
    args: eventArgs,
    enabled: treasuryVaultConfigured,
    onLogs: () => {
      void refetchFinanceData()
    },
  })

  useWatchContractEvent({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault : undefined,
    eventName: 'UnderlyingUnwrapRequested',
    args: eventArgs,
    enabled: treasuryVaultConfigured,
    onLogs: () => {
      void refetchFinanceData()
    },
  })

  useWatchContractEvent({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    eventName: 'ConfidentialTransfer',
    args: transferEventArgs,
    enabled: Boolean(selectedSettlementAsset?.settlementToken && treasuryVaultConfigured),
    onLogs: () => {
      void refetchFinanceData()
    },
  })

  const payrollTransferAmountByTxAndRecipient = useMemo(() => {
    const transferMap = new Map<string, Hex>()

    for (const transferLog of (payrollTransferLogs ?? []) as ConfidentialTransferLog[]) {
      const amountHandle = normalizeHandle(transferLog.args.amount)
      const recipient = transferLog.args.to
      if (amountHandle && recipient) {
        transferMap.set(getTransferKey(transferLog.transactionHash, recipient), amountHandle)
      }
    }

    return transferMap
  }, [payrollTransferLogs])

  const transactionAmountDecryptRequests = useMemo(() => {
    if (!selectedSettlementAsset?.settlementToken) {
      return undefined
    }

    const payrollAmountHandles = ((payrollLogs ?? []) as VaultEventLog[])
      .map((log) => {
        const recipient = log.args.to
        return recipient
          ? payrollTransferAmountByTxAndRecipient.get(getTransferKey(log.transactionHash, recipient)) ?? null
          : null
      })
      .filter((handle): handle is Hex => Boolean(handle))

    const requests = Array.from(new Set(payrollAmountHandles))
      .map(handle => ({
        contractAddress: selectedSettlementAsset.settlementToken as Address,
        handle,
      }))

    return requests.length > 0 ? requests : undefined
  }, [payrollLogs, payrollTransferAmountByTxAndRecipient, selectedSettlementAsset?.settlementToken])

  const transactionAmountDecrypt = useFHEDecrypt({
    requests: transactionAmountDecryptRequests,
  })

  const transactionRows = useMemo(() => {
    const decimals = selectedSettlementAsset?.decimals ?? 6
    const rows: FinanceTransactionRow[] = [
      ...((depositAndWrapLogs ?? []) as VaultEventLog[]).map(log => ({
        amount: typeof log.args.amount === 'bigint' ? formatUnits(log.args.amount, decimals) : null,
        amountHandle: null,
        blockNumber: getSortableBlockNumber(log),
        executedAt: null,
        hash: log.transactionHash,
        logIndex: getSortableLogIndex(log),
        requestId: null,
        type: 'deposit' as const,
      })),
      ...((payrollLogs ?? []) as VaultEventLog[]).map((log) => {
        const recipient = log.args.to
        const amountHandle = recipient
          ? payrollTransferAmountByTxAndRecipient.get(getTransferKey(log.transactionHash, recipient)) ?? null
          : null

        return {
          amount: amountHandle ? toTokenAmount(getDecryptedValue(transactionAmountDecrypt.results, amountHandle), decimals) : null,
          amountHandle,
          blockNumber: getSortableBlockNumber(log),
          executedAt: typeof log.args.executedAt === 'bigint' ? Number(log.args.executedAt) : null,
          hash: log.transactionHash,
          logIndex: getSortableLogIndex(log),
          requestId: null,
          type: 'payroll' as const,
        }
      }),
      ...((refundRequestLogs ?? []) as VaultEventLog[]).map(log => ({
        amount: null,
        amountHandle: null,
        blockNumber: getSortableBlockNumber(log),
        executedAt: null,
        hash: log.transactionHash,
        logIndex: getSortableLogIndex(log),
        requestId: log.args.unwrapRequestId ?? null,
        type: 'refund-request' as const,
      })),
    ]

    return rows.sort((a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return b.logIndex - a.logIndex
      }

      return a.blockNumber > b.blockNumber ? -1 : 1
    })
  }, [
    depositAndWrapLogs,
    payrollLogs,
    payrollTransferAmountByTxAndRecipient,
    refundRequestLogs,
    selectedSettlementAsset?.decimals,
    transactionAmountDecrypt.results,
  ])

  const depositAndWrap = useCallback(async (amountText: string) => {
    if (!address || !selectedSettlementAsset || !treasuryVaultConfigured) {
      toast.error('Wallet, asset, or treasury vault is not ready.')
      return false
    }

    const amount = parseUnits(amountText, selectedSettlementAsset.decimals)
    if (amount <= 0n) {
      toast.error('Deposit amount must be greater than zero.')
      return false
    }

    setIsDepositing(true)

    try {
      const resetApproveHash = await mutateAsync({
        abi: ERC20.abi,
        address: selectedSettlementAsset.underlyingToken as Address,
        functionName: 'approve',
        args: [treasuryVault, 0n],
        account: address,
      })
      await waitForReceipt(resetApproveHash)

      const approveHash = await mutateAsync({
        abi: ERC20.abi,
        address: selectedSettlementAsset.underlyingToken as Address,
        functionName: 'approve',
        args: [treasuryVault, amount],
        account: address,
      })
      await waitForReceipt(approveHash)

      const depositHash = await mutateAsync({
        abi: CompanyTreasuryVault.abi,
        address: treasuryVault,
        functionName: 'depositAndWrapUnderlying',
        args: [amount],
        account: address,
      })
      await waitForReceipt(depositHash)

      await refetchFinanceData()
      toast.success('Deposit wrapped into treasury vault.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to deposit treasury funds.')
      return false
    }
    finally {
      setIsDepositing(false)
    }
  }, [
    address,
    mutateAsync,
    refetchFinanceData,
    selectedSettlementAsset,
    treasuryVault,
    treasuryVaultConfigured,
    waitForReceipt,
  ])

  const withdrawWrappedBalance = useCallback(async () => {
    if (!address || !selectedSettlementAsset || !treasuryVaultConfigured) {
      toast.error('Wallet, asset, or treasury vault is not ready.')
      return false
    }
    if (!instance) {
      toast.error('FHEVM is not ready.')
      return false
    }

    setIsWithdrawingWrapped(true)

    try {
      const hash = await mutateAsync({
        abi: CompanyTreasuryVault.abi,
        address: treasuryVault,
        functionName: 'refundAllWrappedUnderlying',
        args: [],
        account: address,
      })
      const refundReceipt = await waitForReceipt(hash)
      const { unwrapRequestId, unwrapAmountHandle } = getRefundUnwrapData(
        refundReceipt,
        treasuryVault,
        selectedSettlementAsset.settlementToken as Address,
      )
      if (!unwrapRequestId || !unwrapAmountHandle) {
        throw new Error('Unable to locate unwrap request data.')
      }

      const decrypted = await instance.publicDecrypt([unwrapAmountHandle])
      const clearAmount = toUint64Amount(getPublicDecryptClearValue(decrypted.clearValues, unwrapAmountHandle))
      if (clearAmount === null) {
        throw new Error('Unable to decrypt unwrap amount.')
      }

      const finalizeHash = await mutateAsync({
        abi: ERC7984Wrapper.abi,
        address: selectedSettlementAsset.settlementToken as Address,
        functionName: 'finalizeUnwrap',
        args: [unwrapRequestId, clearAmount, decrypted.decryptionProof],
        account: address,
      })
      await waitForReceipt(finalizeHash)

      await refetchFinanceData()
      toast.success('Treasury balance withdrawn.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to withdraw treasury balance.')
      return false
    }
    finally {
      setIsWithdrawingWrapped(false)
    }
  }, [
    address,
    instance,
    mutateAsync,
    refetchFinanceData,
    selectedSettlementAsset,
    treasuryVault,
    treasuryVaultConfigured,
    waitForReceipt,
  ])
  const decryptTransactionAmount = useCallback((handle: Hex) => {
    if (!selectedSettlementAsset?.settlementToken) {
      return
    }

    transactionAmountDecrypt.decryptRequest({
      contractAddress: selectedSettlementAsset.settlementToken as Address,
      handle,
    })
  }, [selectedSettlementAsset?.settlementToken, transactionAmountDecrypt])
  const isDecryptingTransactionAmount = useCallback((handle: Hex) => {
    if (!selectedSettlementAsset?.settlementToken) {
      return false
    }

    return transactionAmountDecrypt.isDecryptingRequest({
      contractAddress: selectedSettlementAsset.settlementToken as Address,
      handle,
    })
  }, [selectedSettlementAsset?.settlementToken, transactionAmountDecrypt])

  return {
    canDecryptVaultBalance: vaultBalanceDecrypt.canDecrypt,
    canDecryptTransactionAmounts: transactionAmountDecrypt.canDecrypt,
    decryptTransactionAmount,
    decryptVaultBalance: vaultBalanceDecrypt.decrypt,
    decryptTransactionAmounts: transactionAmountDecrypt.decrypt,
    financeHistoryDecryptError: transactionAmountDecrypt.error,
    isDecryptingVaultBalance: vaultBalanceDecrypt.isDecrypting,
    isDecryptingTransactionAmount,
    isDecryptingTransactionAmounts: transactionAmountDecrypt.isDecrypting,
    isDepositing,
    isLoading: isLoadingPublicBalances || isLoadingConfidentialBalance,
    isWithdrawingWrapped,
    ownerUnderlyingBalance,
    refetchFinanceData,
    selectedSettlementAsset,
    transactionRows,
    treasuryVault,
    treasuryVaultConfigured,
    vaultConfidentialBalance,
    vaultConfidentialBalanceError: vaultBalanceDecrypt.error,
    vaultConfidentialBalanceHandle,
    vaultUnusedUnderlyingBalance,
    depositAndWrap,
    withdrawWrappedBalance,
  } as const
}
