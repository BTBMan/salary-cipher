'use client'

import type { CompanySummary } from '@/contexts'
import type { Hash, Hex, TransactionReceipt } from 'viem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { decodeEventLog, zeroAddress, zeroHash } from 'viem'
import { useConnection, useContractEvents, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'

interface ReceiptWaiter {
  hash: Hash
  resolve: (receipt: TransactionReceipt) => void
  reject: (error: Error) => void
}

interface AuditGeneratedLog {
  args: {
    auditId?: bigint
    companyId?: bigint
  }
  blockNumber?: bigint
  logIndex?: number
  transactionHash: Hex
}

interface AuditFinalizedLog {
  args: {
    auditId?: bigint
    companyId?: bigint
  }
  blockNumber?: bigint
  logIndex?: number
  transactionHash: Hex
}

interface AuditReportRecord {
  timestamp: bigint
  totalSalarySum: Hex
  headcount: bigint
  gapWithinThreshold: Hex
}

export interface ComplianceAuditRow {
  auditId: bigint
  blockNumber: bigint | null
  canDecrypt: boolean
  generatedAt: number
  gapHandle: Hex | null
  gapResult: boolean | null
  hash: Hex | null
  headcount: bigint
  isFinalized: boolean
}

function isActiveHandle(value: unknown): value is Hex {
  return typeof value === 'string' && value !== '0x' && value !== zeroAddress && value !== zeroHash
}

function getBigIntValue(value: unknown, key: string, index: number) {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  const rawValue = objectValue[key] ?? arrayValue[index]
  return typeof rawValue === 'bigint' ? rawValue : BigInt(Number(rawValue ?? 0))
}

function getHexValue(value: unknown, key: string, index: number) {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  return (objectValue[key] ?? arrayValue[index]) as Hex
}

function parseAuditReport(value: unknown): AuditReportRecord {
  return {
    timestamp: getBigIntValue(value, 'timestamp', 0),
    totalSalarySum: getHexValue(value, 'totalSalarySum', 1),
    headcount: getBigIntValue(value, 'headcount', 2),
    gapWithinThreshold: getHexValue(value, 'gapWithinThreshold', 3),
  }
}

function getDecryptedValue(results: Record<string, string | bigint | boolean>, handle: Hex) {
  return results[handle] ?? results[handle.toLowerCase()] ?? results[handle.toUpperCase()]
}

function getAuditIdFromReceipt(receipt: TransactionReceipt) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== SalaryCipherCore.address.toLowerCase()) {
      continue
    }

    try {
      const decoded = decodeEventLog({
        abi: SalaryCipherCore.abi,
        data: log.data,
        topics: log.topics,
      }) as { args?: { auditId?: bigint }, eventName?: string }

      if (decoded.eventName === 'AuditGenerated') {
        const args = decoded.args as { auditId?: bigint } | undefined
        return args?.auditId ?? null
      }
    }
    catch {
      // Ignore unrelated logs in the same transaction.
    }
  }

  return null
}

export function useComplianceAudit(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const { mutateAsync } = useWriteContract()
  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false)
  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null

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
    data: latestAuditIdResult,
    refetch: refetchLatestAuditId,
  } = useReadContract({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    functionName: 'nextAuditId',
    args: companyId ? [companyId] : undefined,
    query: {
      enabled: Boolean(companyId),
    },
  })

  const auditIds = useMemo(() => {
    const latestAuditId = typeof latestAuditIdResult === 'bigint' ? latestAuditIdResult : 0n
    return Array.from({ length: Number(latestAuditId) }, (_, index) => BigInt(index + 1))
  }, [latestAuditIdResult])

  const auditReportContracts = useMemo(() => {
    if (!companyId) {
      return []
    }

    return auditIds.map(auditId => ({
      abi: SalaryCipherCore.abi,
      address: SalaryCipherCore.address,
      functionName: 'auditReports',
      args: [companyId, auditId],
    }) as const)
  }, [auditIds, companyId])

  const {
    data: auditReportResults,
    refetch: refetchAuditReports,
  } = useReadContracts({
    contracts: auditReportContracts,
    query: {
      enabled: auditReportContracts.length > 0,
    },
  })

  const auditEventArgs = useMemo(() => {
    return companyId ? { companyId } : undefined
  }, [companyId])

  const {
    data: auditGeneratedLogs,
    refetch: refetchAuditGeneratedLogs,
  } = useContractEvents({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    eventName: 'AuditGenerated',
    args: auditEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: Boolean(companyId),
    },
  })

  const {
    data: auditFinalizedLogs,
    refetch: refetchAuditFinalizedLogs,
  } = useContractEvents({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    eventName: 'AuditFinalized',
    args: auditEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: Boolean(companyId),
    },
  })

  const refetchAuditData = useCallback(async () => {
    await Promise.all([
      refetchLatestAuditId(),
      refetchAuditReports(),
      refetchAuditGeneratedLogs(),
      refetchAuditFinalizedLogs(),
    ])
  }, [refetchAuditFinalizedLogs, refetchAuditGeneratedLogs, refetchAuditReports, refetchLatestAuditId])

  useWatchContractEvent({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    eventName: 'AuditGenerated',
    args: auditEventArgs,
    enabled: Boolean(companyId),
    onLogs: () => {
      void refetchAuditData()
    },
  })

  useWatchContractEvent({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    eventName: 'AuditFinalized',
    args: auditEventArgs,
    enabled: Boolean(companyId),
    onLogs: () => {
      void refetchAuditData()
    },
  })

  const generatedLogByAuditId = useMemo(() => {
    const logs = new Map<string, AuditGeneratedLog>()
    for (const log of (auditGeneratedLogs ?? []) as AuditGeneratedLog[]) {
      const auditId = log.args.auditId
      if (auditId !== undefined) {
        logs.set(auditId.toString(), log)
      }
    }
    return logs
  }, [auditGeneratedLogs])

  const finalizedAuditIds = useMemo(() => {
    return new Set(((auditFinalizedLogs ?? []) as AuditFinalizedLog[])
      .map(log => log.args.auditId)
      .filter((auditId): auditId is bigint => auditId !== undefined)
      .map(auditId => auditId.toString()))
  }, [auditFinalizedLogs])

  const parsedReports = useMemo(() => {
    return auditIds.map((auditId, index) => {
      const result = auditReportResults?.[index]
      if (result?.status !== 'success') {
        return null
      }

      const report = parseAuditReport(result.result)
      if (report.timestamp === 0n) {
        return null
      }

      return { auditId, report }
    }).filter((item): item is { auditId: bigint, report: AuditReportRecord } => Boolean(item))
  }, [auditIds, auditReportResults])

  const decryptRequests = useMemo(() => {
    const requests = parsedReports
      .map(item => item.report.gapWithinThreshold)
      .filter(isActiveHandle)
      .map(handle => ({
        contractAddress: SalaryCipherCore.address,
        handle,
      }))

    return requests.length > 0 ? requests : undefined
  }, [parsedReports])

  const gapDecrypt = useFHEDecrypt({
    requests: decryptRequests,
  })

  const rows = useMemo(() => {
    return parsedReports
      .map(({ auditId, report }) => {
        const gapHandle = isActiveHandle(report.gapWithinThreshold) ? report.gapWithinThreshold : null
        const decryptedGap = gapHandle ? getDecryptedValue(gapDecrypt.results, gapHandle) : undefined
        const generatedLog = generatedLogByAuditId.get(auditId.toString()) ?? null

        return {
          auditId,
          blockNumber: generatedLog?.blockNumber ?? null,
          canDecrypt: Boolean(gapHandle),
          generatedAt: Number(report.timestamp),
          gapHandle,
          gapResult: typeof decryptedGap === 'boolean' ? decryptedGap : null,
          hash: generatedLog?.transactionHash ?? null,
          headcount: report.headcount,
          isFinalized: finalizedAuditIds.has(auditId.toString()),
        } satisfies ComplianceAuditRow
      })
      .sort((a, b) => Number(b.auditId - a.auditId))
  }, [finalizedAuditIds, gapDecrypt.results, generatedLogByAuditId, parsedReports])

  const latestAudit = rows[0] ?? null

  const generateAndFinalizeAudit = useCallback(async () => {
    if (!address || !companyId) {
      toast.error('Wallet or company is not ready.')
      return false
    }

    setIsGeneratingAudit(true)

    try {
      const generateHash = await mutateAsync({
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'generateAudit',
        args: [companyId],
        account: address,
      })
      const generateReceipt = await waitForReceipt(generateHash)
      const auditId = getAuditIdFromReceipt(generateReceipt)

      if (!auditId) {
        throw new Error('AuditGenerated event was not found.')
      }

      const finalizeHash = await mutateAsync({
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'finalizeAudit',
        args: [companyId, auditId],
        account: address,
      })
      await waitForReceipt(finalizeHash)
      await refetchAuditData()
      toast.success('Compliance audit generated.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to generate compliance audit.')
      return false
    }
    finally {
      setIsGeneratingAudit(false)
    }
  }, [address, companyId, mutateAsync, refetchAuditData, waitForReceipt])

  return {
    decryptAuditResult: gapDecrypt.decryptRequest,
    generateAndFinalizeAudit,
    isDecryptingAuditResult: gapDecrypt.isDecryptingRequest,
    isGeneratingAudit,
    latestAudit,
    refetchAuditData,
    rows,
  }
}
