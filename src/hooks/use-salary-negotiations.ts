'use client'

import type { CompanyEmployee } from './use-company-employees'
import type { CompanySummary } from '@/contexts'
import type { Address, Hash, Hex } from 'viem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { isAddress, parseUnits, toHex, zeroAddress, zeroHash } from 'viem'
import { useConnection, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { z } from 'zod'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { SalaryNegotiation } from '@/contract-data/salary-negotiation'
import { RolesEnum } from '@/enums'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useFHEEncrypt } from './fhevm/use-fhe-encrypt'
import { useStoreContext } from './use-store-context'

export enum SalaryNegotiationStatus {
  Open,
  WaitingEmployerOffer,
  WaitingEmployeeAsk,
  ReadyToMatch,
  Computed,
  Applied,
  Cancelled,
}

interface UseSalaryNegotiationsParams {
  employees: CompanyEmployee[]
  refreshEmployees: () => Promise<void>
  selectedCompany: CompanySummary | null
}

interface ReceiptWaiter {
  hash: Hash
  resolve: () => void
  reject: (error: Error) => void
}

interface NegotiationRecord {
  companyId: bigint
  currentRound: bigint
  employee: Address
  initiator: Address
  status: SalaryNegotiationStatus
  createdAt: bigint
  updatedAt: bigint
}

interface NegotiationRoundRecord {
  employerOffer: Hex
  employeeAsk: Hex
  finalSalary: Hex
  matched: Hex
  hasEmployerOffer: boolean
  hasEmployeeAsk: boolean
  createdAt: bigint
  resolvedAt: bigint
}

export interface SalaryNegotiationRow {
  canApply: boolean
  canCancel: boolean
  canCompute: boolean
  canStartNewRound: boolean
  canSubmitEmployeeAsk: boolean
  canSubmitEmployerOffer: boolean
  currentRound: bigint
  employee: CompanyEmployee
  id: bigint
  initiator: Address
  isEmployeeInitiated: boolean
  matchHandle: Hex | null
  matchResult: boolean | null
  round: NegotiationRoundRecord | null
  status: SalaryNegotiationStatus
  updatedAt: number
}

const amountSchema = z.string().trim().min(1).regex(/^\d+(\.\d+)?$/)
const submittableStatuses = new Set<SalaryNegotiationStatus>([
  SalaryNegotiationStatus.Open,
  SalaryNegotiationStatus.WaitingEmployerOffer,
  SalaryNegotiationStatus.WaitingEmployeeAsk,
])
const inactiveStatuses = new Set<SalaryNegotiationStatus>([
  SalaryNegotiationStatus.Applied,
  SalaryNegotiationStatus.Cancelled,
])

function isActiveHandle(value: unknown): value is Hex {
  return typeof value === 'string' && value !== '0x' && value !== zeroAddress && value !== zeroHash
}

function getDecryptedValue(results: Record<string, string | bigint | boolean>, handle: Hex) {
  return results[handle] ?? results[handle.toLowerCase()] ?? results[handle.toUpperCase()]
}

function getAddressValue(value: unknown, key: string, index: number): Address {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  return (objectValue[key] ?? arrayValue[index]) as Address
}

function getBigIntValue(value: unknown, key: string, index: number): bigint {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  return (objectValue[key] ?? arrayValue[index]) as bigint
}

function getBooleanValue(value: unknown, key: string, index: number): boolean {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  return Boolean(objectValue[key] ?? arrayValue[index])
}

function parseNegotiationRecord(value: unknown): NegotiationRecord {
  return {
    companyId: getBigIntValue(value, 'companyId', 0),
    employee: getAddressValue(value, 'employee', 1),
    initiator: getAddressValue(value, 'initiator', 2),
    currentRound: getBigIntValue(value, 'currentRound', 3),
    status: Number(getBigIntValue(value, 'status', 4)) as SalaryNegotiationStatus,
    createdAt: getBigIntValue(value, 'createdAt', 5),
    updatedAt: getBigIntValue(value, 'updatedAt', 6),
  }
}

function parseRoundRecord(value: unknown): NegotiationRoundRecord {
  return {
    employerOffer: getAddressValue(value, 'employerOffer', 0) as Hex,
    employeeAsk: getAddressValue(value, 'employeeAsk', 1) as Hex,
    finalSalary: getAddressValue(value, 'finalSalary', 2) as Hex,
    matched: getAddressValue(value, 'matched', 3) as Hex,
    hasEmployerOffer: getBooleanValue(value, 'hasEmployerOffer', 4),
    hasEmployeeAsk: getBooleanValue(value, 'hasEmployeeAsk', 5),
    createdAt: getBigIntValue(value, 'createdAt', 6),
    resolvedAt: getBigIntValue(value, 'resolvedAt', 7),
  }
}

function readHistoryIds(data: unknown, employeeIndex: number) {
  const result = (data as Array<{ status: string, result?: bigint[] }> | undefined)?.[employeeIndex]
  return result?.status === 'success' ? result.result ?? [] : []
}

/**
 * Loads salary adjustment negotiations and exposes only role-valid mutations.
 */
export function useSalaryNegotiations({
  employees,
  refreshEmployees,
  selectedCompany,
}: UseSalaryNegotiationsParams) {
  const { address } = useConnection()
  const { settlementAssets } = useStoreContext()
  const { mutateAsync } = useWriteContract()
  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const selectedSettlementAsset = useMemo(() => {
    if (!selectedCompany) {
      return null
    }

    return settlementAssets.find(asset => asset.value === selectedCompany.settlementAsset) ?? null
  }, [selectedCompany, settlementAssets])

  const { data: configuredNegotiationAddress } = useReadContract({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    functionName: 'salaryNegotiationAddress',
    query: {
      enabled: Boolean(SalaryCipherCore.address),
    },
  })

  const salaryNegotiationAddress = useMemo(() => {
    if (typeof configuredNegotiationAddress === 'string' && isAddress(configuredNegotiationAddress) && configuredNegotiationAddress !== zeroAddress) {
      return configuredNegotiationAddress as Address
    }

    return SalaryNegotiation.address
  }, [configuredNegotiationAddress])

  const { canEncrypt, encryptWith } = useFHEEncrypt({
    contractAddress: salaryNegotiationAddress,
  })

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
    waiter.resolve()
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

    return new Promise<void>((resolve, reject) => {
      receiptWaiterRef.current = {
        hash,
        resolve,
        reject,
      }
      setReceiptHash(hash)
    })
  }, [])

  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null
  const isOwner = selectedCompany?.role === RolesEnum.Owner
  const visibleEmployees = useMemo(() => {
    if (!address) {
      return []
    }
    const negotiableEmployees = employees.filter(employee => employee.monthlySalaryHandle)
    if (isOwner) {
      return negotiableEmployees
    }

    return negotiableEmployees.filter(employee => employee.account.toLowerCase() === address.toLowerCase())
  }, [address, employees, isOwner])

  const historyContracts = useMemo(() => {
    if (!companyId || !salaryNegotiationAddress) {
      return []
    }

    return visibleEmployees.map(employee => ({
      abi: SalaryNegotiation.abi,
      address: salaryNegotiationAddress,
      functionName: 'getNegotiationHistory',
      args: [companyId, employee.account],
    }) as const)
  }, [companyId, salaryNegotiationAddress, visibleEmployees])

  const {
    data: historyResults,
    error: historyError,
    isLoading: isLoadingHistories,
    refetch: refetchHistories,
  } = useReadContracts({
    contracts: historyContracts,
    query: {
      enabled: historyContracts.length > 0,
    },
  })

  const negotiationIds = useMemo(() => {
    const ids = (historyResults ?? []).flatMap(result =>
      result.status === 'success' ? (result.result as bigint[]) : [],
    )
    return Array.from(new Set(ids.map(id => id.toString()))).map(id => BigInt(id))
  }, [historyResults])

  const negotiationContracts = useMemo(() => {
    if (!salaryNegotiationAddress) {
      return []
    }

    return negotiationIds.map(id => ({
      abi: SalaryNegotiation.abi,
      address: salaryNegotiationAddress,
      functionName: 'negotiations',
      args: [id],
    }) as const)
  }, [negotiationIds, salaryNegotiationAddress])

  const {
    data: negotiationResults,
    error: negotiationError,
    isLoading: isLoadingNegotiations,
    refetch: refetchNegotiations,
  } = useReadContracts({
    contracts: negotiationContracts,
    query: {
      enabled: negotiationContracts.length > 0,
    },
  })

  const parsedNegotiations = useMemo(() => {
    return negotiationIds.map((id, index) => {
      const result = negotiationResults?.[index]
      if (result?.status !== 'success') {
        return null
      }

      return {
        id,
        data: parseNegotiationRecord(result.result),
      }
    }).filter((item): item is { id: bigint, data: NegotiationRecord } => Boolean(item))
  }, [negotiationIds, negotiationResults])

  const roundContracts = useMemo(() => {
    if (!salaryNegotiationAddress) {
      return []
    }

    return parsedNegotiations.map(item => ({
      abi: SalaryNegotiation.abi,
      address: salaryNegotiationAddress,
      functionName: 'getNegotiationRound',
      args: [item.id, item.data.currentRound],
    }) as const)
  }, [parsedNegotiations, salaryNegotiationAddress])

  const {
    data: roundResults,
    error: roundError,
    isLoading: isLoadingRounds,
    refetch: refetchRounds,
  } = useReadContracts({
    contracts: roundContracts,
    query: {
      enabled: roundContracts.length > 0,
    },
  })

  const parsedRounds = useMemo(() => {
    return parsedNegotiations.map((item, index) => {
      const result = roundResults?.[index]
      return {
        id: item.id,
        round: result?.status === 'success' ? parseRoundRecord(result.result) : null,
      }
    })
  }, [parsedNegotiations, roundResults])

  const matchDecryptRequests = useMemo(() => {
    if (!salaryNegotiationAddress) {
      return undefined
    }

    const requests = parsedRounds
      .map(({ round }) => round?.matched)
      .filter(isActiveHandle)
      .map(handle => ({
        contractAddress: salaryNegotiationAddress,
        handle,
      }))

    return requests.length > 0 ? requests : undefined
  }, [parsedRounds, salaryNegotiationAddress])

  const matchDecrypt = useFHEDecrypt({
    requests: matchDecryptRequests,
  })

  const rows = useMemo(() => {
    const employeeByAddress = new Map(visibleEmployees.map(employee => [employee.account.toLowerCase(), employee]))
    const roundById = new Map(parsedRounds.map(item => [item.id.toString(), item.round]))

    return parsedNegotiations
      .map((item) => {
        const employee = employeeByAddress.get(item.data.employee.toLowerCase())
        if (!employee) {
          return null
        }

        const round = roundById.get(item.id.toString()) ?? null
        const isSelf = address?.toLowerCase() === employee.account.toLowerCase()
        const isEmployeeInitiated = item.data.initiator.toLowerCase() === employee.account.toLowerCase()
        const matchHandle = round?.matched && isActiveHandle(round.matched) ? round.matched : null
        const decryptedMatch = matchHandle ? getDecryptedValue(matchDecrypt.results, matchHandle) : undefined
        const matchResult = typeof decryptedMatch === 'boolean' ? decryptedMatch : null
        const canSubmitEmployerOffer = Boolean(
          isOwner
          && round
          && !round.hasEmployerOffer
          && submittableStatuses.has(item.data.status),
        )
        const canSubmitEmployeeAsk = Boolean(
          isSelf
          && round
          && !round.hasEmployeeAsk
          && submittableStatuses.has(item.data.status),
        )
        const canUseComputedResult = item.data.status === SalaryNegotiationStatus.Computed

        return {
          canApply: Boolean(isOwner && canUseComputedResult && matchResult === true),
          canCancel: Boolean(
            item.data.status !== SalaryNegotiationStatus.Applied
            && item.data.status !== SalaryNegotiationStatus.Cancelled
            && (isOwner || (isSelf && isEmployeeInitiated)),
          ),
          canCompute: Boolean(
            item.data.status === SalaryNegotiationStatus.ReadyToMatch
            && (isOwner || isSelf),
          ),
          canStartNewRound: Boolean((isOwner || isSelf) && canUseComputedResult && matchResult === false),
          canSubmitEmployeeAsk,
          canSubmitEmployerOffer,
          currentRound: item.data.currentRound,
          employee,
          id: item.id,
          initiator: item.data.initiator,
          isEmployeeInitiated,
          matchHandle,
          matchResult,
          round,
          status: item.data.status,
          updatedAt: Number(item.data.updatedAt),
        } satisfies SalaryNegotiationRow
      })
      .filter((row): row is SalaryNegotiationRow => Boolean(row))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [address, isOwner, matchDecrypt.results, parsedNegotiations, parsedRounds, visibleEmployees])

  const activeRows = useMemo(() => {
    return rows.filter(row => !inactiveStatuses.has(row.status))
  }, [rows])

  const refetchNegotiationData = useCallback(async () => {
    await refetchHistories()
    await refetchNegotiations()
    await refetchRounds()
  }, [refetchHistories, refetchNegotiations, refetchRounds])

  useEffect(() => {
    if (historyError || negotiationError || roundError) {
      console.error(historyError ?? negotiationError ?? roundError)
      toast.error('Failed to load negotiations from chain.')
    }
  }, [historyError, negotiationError, roundError])

  const encryptAmount = useCallback(async (amountText: string) => {
    if (!selectedSettlementAsset) {
      toast.error('Settlement asset is not ready.')
      return null
    }
    if (!canEncrypt) {
      toast.error('FHE encryption is not ready.')
      return null
    }

    const parsedAmountText = amountSchema.safeParse(amountText)
    if (!parsedAmountText.success) {
      toast.error('Enter a valid salary amount.')
      return null
    }

    try {
      const amount = parseUnits(parsedAmountText.data, selectedSettlementAsset.decimals)
      if (amount <= 0n) {
        toast.error('Salary amount must be greater than zero.')
        return null
      }

      const encryptedAmount = await encryptWith(builder => builder.add128(amount))
      if (!encryptedAmount) {
        toast.error('FHE encryption is not ready.')
        return null
      }

      return {
        handle: toHex(encryptedAmount.handles[0]),
        proof: toHex(encryptedAmount.inputProof),
      }
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to encrypt salary amount.')
      return null
    }
  }, [canEncrypt, encryptWith, selectedSettlementAsset])

  const runTransaction = useCallback(async (
    actionKey: string,
    request: {
      args: readonly unknown[]
      functionName: string
      successMessage: string
    },
  ) => {
    if (!address || !salaryNegotiationAddress) {
      toast.error('Wallet or negotiation contract is not ready.')
      return false
    }

    setPendingAction(actionKey)

    try {
      const hash = await mutateAsync({
        abi: SalaryNegotiation.abi,
        address: salaryNegotiationAddress,
        functionName: request.functionName,
        args: request.args,
        account: address,
      })
      await waitForReceipt(hash)
      await refetchNegotiationData()
      toast.success(request.successMessage)
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Transaction failed.')
      return false
    }
    finally {
      setPendingAction(null)
    }
  }, [address, mutateAsync, refetchNegotiationData, salaryNegotiationAddress, waitForReceipt])

  const getLatestHistoryId = useCallback((historyData: unknown, employee: Address) => {
    const employeeIndex = visibleEmployees.findIndex(item => item.account.toLowerCase() === employee.toLowerCase())
    if (employeeIndex < 0) {
      return null
    }

    return readHistoryIds(historyData, employeeIndex).at(-1) ?? null
  }, [visibleEmployees])

  const submitEmployerOffer = useCallback(async (negotiationId: bigint, amountText: string) => {
    const encryptedAmount = await encryptAmount(amountText)
    if (!encryptedAmount) {
      return false
    }

    return runTransaction(`offer:${negotiationId.toString()}`, {
      functionName: 'submitEmployerOffer',
      args: [negotiationId, encryptedAmount.handle, encryptedAmount.proof],
      successMessage: 'Employer offer submitted.',
    })
  }, [encryptAmount, runTransaction])

  const submitEmployeeAsk = useCallback(async (negotiationId: bigint, amountText: string) => {
    const encryptedAmount = await encryptAmount(amountText)
    if (!encryptedAmount) {
      return false
    }

    return runTransaction(`ask:${negotiationId.toString()}`, {
      functionName: 'submitEmployeeAsk',
      args: [negotiationId, encryptedAmount.handle, encryptedAmount.proof],
      successMessage: 'Employee ask submitted.',
    })
  }, [encryptAmount, runTransaction])

  const createAndSubmit = useCallback(async (employee: Address, amountText: string) => {
    if (!address || !companyId || !salaryNegotiationAddress) {
      toast.error('Wallet, company, or negotiation contract is not ready.')
      return false
    }

    const encryptedAmount = await encryptAmount(amountText)
    if (!encryptedAmount) {
      return false
    }

    const actionKey = `create:${employee.toLowerCase()}`
    setPendingAction(actionKey)

    try {
      const createHash = await mutateAsync({
        abi: SalaryNegotiation.abi,
        address: salaryNegotiationAddress,
        functionName: 'createNegotiation',
        args: [companyId, employee],
        account: address,
      })
      await waitForReceipt(createHash)

      const historyResult = await refetchHistories()
      const negotiationId = getLatestHistoryId(historyResult.data, employee)
      if (!negotiationId) {
        toast.error('Negotiation was created, but its id was not found.')
        await refetchNegotiationData()
        return false
      }

      const functionName = isOwner ? 'submitEmployerOffer' : 'submitEmployeeAsk'
      const submitHash = await mutateAsync({
        abi: SalaryNegotiation.abi,
        address: salaryNegotiationAddress,
        functionName,
        args: [negotiationId, encryptedAmount.handle, encryptedAmount.proof],
        account: address,
      })
      await waitForReceipt(submitHash)
      await refetchNegotiationData()
      toast.success('Negotiation created.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to create negotiation.')
      return false
    }
    finally {
      setPendingAction(null)
    }
  }, [
    address,
    companyId,
    encryptAmount,
    getLatestHistoryId,
    isOwner,
    mutateAsync,
    refetchHistories,
    refetchNegotiationData,
    salaryNegotiationAddress,
    waitForReceipt,
  ])

  const computeMatch = useCallback((negotiationId: bigint) => {
    return runTransaction(`compute:${negotiationId.toString()}`, {
      functionName: 'computeMatch',
      args: [negotiationId],
      successMessage: 'Match result computed.',
    })
  }, [runTransaction])

  const applyMatchedSalary = useCallback(async (negotiationId: bigint) => {
    const applied = await runTransaction(`apply:${negotiationId.toString()}`, {
      functionName: 'applyMatchedSalary',
      args: [negotiationId],
      successMessage: 'Negotiated salary applied.',
    })

    if (applied) {
      await refreshEmployees()
    }

    return applied
  }, [refreshEmployees, runTransaction])

  const newRound = useCallback((negotiationId: bigint) => {
    return runTransaction(`round:${negotiationId.toString()}`, {
      functionName: 'newRound',
      args: [negotiationId],
      successMessage: 'New negotiation round started.',
    })
  }, [runTransaction])

  const cancelNegotiation = useCallback((negotiationId: bigint) => {
    return runTransaction(`cancel:${negotiationId.toString()}`, {
      functionName: 'cancelNegotiation',
      args: [negotiationId],
      successMessage: 'Negotiation cancelled.',
    })
  }, [runTransaction])

  const decryptMatch = useCallback((row: SalaryNegotiationRow) => {
    if (!row.matchHandle || !salaryNegotiationAddress) {
      return
    }

    matchDecrypt.decryptRequest({
      contractAddress: salaryNegotiationAddress,
      handle: row.matchHandle,
    })
  }, [matchDecrypt, salaryNegotiationAddress])

  const isDecryptingMatch = useCallback((row: SalaryNegotiationRow) => {
    if (!row.matchHandle || !salaryNegotiationAddress) {
      return false
    }

    return matchDecrypt.isDecryptingRequest({
      contractAddress: salaryNegotiationAddress,
      handle: row.matchHandle,
    })
  }, [matchDecrypt, salaryNegotiationAddress])

  return {
    activeRows,
    applyMatchedSalary,
    canDecryptMatch: matchDecrypt.canDecrypt,
    canEncrypt,
    cancelNegotiation,
    computeMatch,
    createAndSubmit,
    decryptMatch,
    isDecryptingMatch,
    isLoading: isLoadingHistories || isLoadingNegotiations || isLoadingRounds,
    isReady: Boolean(salaryNegotiationAddress && selectedCompany),
    newRound,
    pendingAction,
    rows,
    selectedSettlementAsset,
    submitEmployeeAsk,
    submitEmployerOffer,
    visibleEmployees,
  } as const
}
