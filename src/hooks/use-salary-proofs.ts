'use client'

import type { CompanySummary } from '@/contexts'
import type { SalaryProofType } from '@/utils'
import type { Address, Hash, Hex, TransactionReceipt } from 'viem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { isAddress, parseUnits, toHex, zeroAddress, zeroHash } from 'viem'
import { useConnection, useContractEvents, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi'
import { ProofNFT } from '@/contract-data/proof-nft'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { SalaryProof } from '@/contract-data/salary-proof'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useFHEEncrypt } from './fhevm/use-fhe-encrypt'
import { useStoreContext } from './use-store-context'

export type SalaryProofStatus = 'valid' | 'expired' | 'revoked'

interface ReceiptWaiter {
  hash: Hash
  resolve: (receipt: TransactionReceipt) => void
  reject: (error: Error) => void
}

interface SalaryProofRecord {
  companyId: bigint
  employee: Address
  proofType: number
  result: Hex
  createdAt: bigint
  expiresAt: bigint
  revoked: boolean
  minted: boolean
  tokenId: bigint
}

export interface SalaryProofRow {
  companyName: string
  condition: string
  createdAt: number
  expiresAt: number
  nftStatus: 'not-minted' | 'minted'
  proofId: bigint
  proofResult: boolean | null
  proofResultHandle: Hex | null
  proofType: SalaryProofType
  proofTypeLabel: string
  settlementToken: string
  status: SalaryProofStatus
  tokenId: bigint | null
}

const proofTypeToEnum = {
  MONTHLY_GTE: 0,
  MONTHLY_BETWEEN: 1,
  EMPLOYMENT_DURATION_GTE: 2,
} as const satisfies Record<SalaryProofType, number>

const proofTypeFromEnum = {
  0: 'MONTHLY_GTE',
  1: 'MONTHLY_BETWEEN',
  2: 'EMPLOYMENT_DURATION_GTE',
} as const satisfies Record<0 | 1 | 2, SalaryProofType>

const proofTypeLabels = {
  MONTHLY_GTE: 'Monthly Salary >= X',
  MONTHLY_BETWEEN: 'Monthly Salary between X and Y',
  EMPLOYMENT_DURATION_GTE: 'Employment Duration >= N months',
} as const satisfies Record<SalaryProofType, string>

function isActiveHandle(value: unknown): value is Hex {
  return typeof value === 'string' && value !== '0x' && value !== zeroAddress && value !== zeroHash
}

function getAddressValue(value: unknown, key: string, index: number) {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  return (objectValue[key] ?? arrayValue[index]) as Address
}

function getBigIntValue(value: unknown, key: string, index: number) {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  const rawValue = objectValue[key] ?? arrayValue[index]
  return typeof rawValue === 'bigint' ? rawValue : BigInt(Number(rawValue ?? 0))
}

function getBooleanValue(value: unknown, key: string, index: number) {
  const objectValue = value as Record<string, unknown>
  const arrayValue = value as unknown[]
  return Boolean(objectValue[key] ?? arrayValue[index])
}

function parseProofRecord(value: unknown): SalaryProofRecord {
  return {
    companyId: getBigIntValue(value, 'companyId', 0),
    employee: getAddressValue(value, 'employee', 1),
    proofType: Number(getBigIntValue(value, 'proofType', 2)),
    result: getAddressValue(value, 'result', 3) as Hex,
    createdAt: getBigIntValue(value, 'createdAt', 4),
    expiresAt: getBigIntValue(value, 'expiresAt', 5),
    revoked: getBooleanValue(value, 'revoked', 6),
    minted: getBooleanValue(value, 'minted', 7),
    tokenId: getBigIntValue(value, 'tokenId', 8),
  }
}

function getDecryptedValue(results: Record<string, string | bigint | boolean>, handle: Hex) {
  return results[handle] ?? results[handle.toLowerCase()] ?? results[handle.toUpperCase()]
}

function getProofStatus(record: SalaryProofRecord): SalaryProofStatus {
  if (record.revoked) {
    return 'revoked'
  }
  if (BigInt(Math.floor(Date.now() / 1000)) > record.expiresAt) {
    return 'expired'
  }
  return 'valid'
}

function getGenericCondition(proofType: SalaryProofType, tokenSymbol: string) {
  switch (proofType) {
    case 'MONTHLY_GTE':
      return `Encrypted monthly salary is greater than or equal to a private ${tokenSymbol} threshold.`
    case 'MONTHLY_BETWEEN':
      return `Encrypted monthly salary is inside a private ${tokenSymbol} range.`
    case 'EMPLOYMENT_DURATION_GTE':
      return 'Employment duration is greater than or equal to the selected month count.'
  }
}

export function useSalaryProofs(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const { settlementAssets } = useStoreContext()
  const { mutateAsync } = useWriteContract()
  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null

  const selectedSettlementAsset = useMemo(() => {
    if (!selectedCompany) {
      return null
    }

    return settlementAssets.find(asset => asset.value === selectedCompany.settlementAsset) ?? null
  }, [selectedCompany, settlementAssets])

  const settlementTokenSymbol = selectedSettlementAsset?.symbol ?? 'USDC'

  const {
    data: configuredSalaryProofAddress,
    refetch: refetchConfiguredSalaryProofAddress,
  } = useReadContract({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    functionName: 'salaryProofAddress',
    query: {
      enabled: Boolean(SalaryCipherCore.address),
    },
  })

  const salaryProofAddress = useMemo(() => {
    if (typeof configuredSalaryProofAddress === 'string' && isAddress(configuredSalaryProofAddress) && configuredSalaryProofAddress !== zeroAddress) {
      return configuredSalaryProofAddress as Address
    }

    return SalaryProof.address
  }, [configuredSalaryProofAddress])

  const { canEncrypt, encryptWith } = useFHEEncrypt({
    contractAddress: salaryProofAddress,
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
    data: proofIdsResult,
    refetch: refetchProofIds,
  } = useReadContract({
    abi: SalaryProof.abi,
    address: salaryProofAddress,
    functionName: 'getEmployeeProofIds',
    args: companyId && address ? [companyId, address] : undefined,
    query: {
      enabled: Boolean(salaryProofAddress && companyId && address),
    },
  })

  const proofIds = useMemo(() => {
    return Array.isArray(proofIdsResult) ? proofIdsResult as bigint[] : []
  }, [proofIdsResult])

  const proofContracts = useMemo(() => {
    if (!salaryProofAddress) {
      return []
    }

    return proofIds.map(proofId => ({
      abi: SalaryProof.abi,
      address: salaryProofAddress,
      functionName: 'proofs',
      args: [proofId],
    }) as const)
  }, [proofIds, salaryProofAddress])

  const {
    data: proofResults,
    refetch: refetchProofRecords,
  } = useReadContracts({
    contracts: proofContracts,
    query: {
      enabled: proofContracts.length > 0,
    },
  })

  const parsedProofs = useMemo(() => {
    return proofIds.map((proofId, index) => {
      const result = proofResults?.[index]
      if (result?.status !== 'success') {
        return null
      }

      const record = parseProofRecord(result.result)
      if (record.employee === zeroAddress) {
        return null
      }

      return { proofId, record }
    }).filter((item): item is { proofId: bigint, record: SalaryProofRecord } => Boolean(item))
  }, [proofIds, proofResults])

  const decryptRequests = useMemo(() => {
    if (!salaryProofAddress) {
      return undefined
    }

    const requests = parsedProofs
      .map(item => item.record.result)
      .filter(isActiveHandle)
      .map(handle => ({
        contractAddress: salaryProofAddress,
        handle,
      }))

    return requests.length > 0 ? requests : undefined
  }, [parsedProofs, salaryProofAddress])

  const proofResultDecrypt = useFHEDecrypt({
    requests: decryptRequests,
  })

  const rows = useMemo(() => {
    return parsedProofs
      .map(({ proofId, record }) => {
        const proofType = (proofTypeFromEnum as Record<number, SalaryProofType | undefined>)[record.proofType] ?? 'MONTHLY_GTE'
        const resultHandle = isActiveHandle(record.result) ? record.result : null
        const decryptedResult = resultHandle ? getDecryptedValue(proofResultDecrypt.results, resultHandle) : undefined

        return {
          companyName: selectedCompany?.name ?? 'Selected Company',
          condition: getGenericCondition(proofType, settlementTokenSymbol),
          createdAt: Number(record.createdAt),
          expiresAt: Number(record.expiresAt),
          nftStatus: record.minted ? 'minted' : 'not-minted',
          proofId,
          proofResult: typeof decryptedResult === 'boolean' ? decryptedResult : null,
          proofResultHandle: resultHandle,
          proofType,
          proofTypeLabel: proofTypeLabels[proofType],
          settlementToken: settlementTokenSymbol,
          status: getProofStatus(record),
          tokenId: record.minted ? record.tokenId : null,
        } satisfies SalaryProofRow
      })
      .sort((a, b) => Number(b.proofId - a.proofId))
  }, [parsedProofs, proofResultDecrypt.results, selectedCompany?.name, settlementTokenSymbol])

  const proofEventArgs = useMemo(() => {
    if (!companyId || !address) {
      return undefined
    }

    return {
      companyId,
      employee: address,
    }
  }, [address, companyId])

  const {
    refetch: refetchProofGeneratedLogs,
  } = useContractEvents({
    abi: SalaryProof.abi,
    address: salaryProofAddress,
    eventName: 'ProofGenerated',
    args: proofEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: Boolean(salaryProofAddress && companyId && address),
    },
  })

  const refetchSalaryProofData = useCallback(async () => {
    await Promise.all([
      refetchConfiguredSalaryProofAddress(),
      refetchProofIds(),
      refetchProofRecords(),
      refetchProofGeneratedLogs(),
    ])
  }, [refetchConfiguredSalaryProofAddress, refetchProofGeneratedLogs, refetchProofIds, refetchProofRecords])

  useWatchContractEvent({
    abi: SalaryProof.abi,
    address: salaryProofAddress,
    eventName: 'ProofGenerated',
    args: proofEventArgs,
    enabled: Boolean(salaryProofAddress && companyId && address),
    onLogs: () => {
      void refetchSalaryProofData()
    },
  })

  useWatchContractEvent({
    abi: SalaryProof.abi,
    address: salaryProofAddress,
    eventName: 'ProofRevoked',
    enabled: Boolean(salaryProofAddress && companyId && address),
    onLogs: () => {
      void refetchSalaryProofData()
    },
  })

  useWatchContractEvent({
    abi: SalaryProof.abi,
    address: salaryProofAddress,
    eventName: 'ProofNFTMinted',
    enabled: Boolean(salaryProofAddress && companyId && address),
    onLogs: () => {
      void refetchSalaryProofData()
    },
  })

  const encryptProofThresholds = useCallback(async (
    proofType: SalaryProofType,
    minAmount: string,
    maxAmount: string,
  ) => {
    if (proofType === 'EMPLOYMENT_DURATION_GTE') {
      return {
        minHandle: zeroHash,
        maxHandle: zeroHash,
        inputProof: '0x' as Hex,
      }
    }
    if (!selectedSettlementAsset) {
      toast.error('Settlement asset is not ready.')
      return null
    }
    if (!canEncrypt) {
      toast.error('FHE encryption is not ready.')
      return null
    }

    try {
      const minValue = parseUnits(minAmount, selectedSettlementAsset.decimals)
      const maxValue = proofType === 'MONTHLY_BETWEEN'
        ? parseUnits(maxAmount, selectedSettlementAsset.decimals)
        : 0n

      const encrypted = await encryptWith((builder) => {
        builder.add128(minValue)
        if (proofType === 'MONTHLY_BETWEEN') {
          builder.add128(maxValue)
        }
      })
      if (!encrypted) {
        toast.error('FHE encryption is not ready.')
        return null
      }

      return {
        minHandle: toHex(encrypted.handles[0]),
        maxHandle: proofType === 'MONTHLY_BETWEEN' ? toHex(encrypted.handles[1]) : zeroHash,
        inputProof: toHex(encrypted.inputProof),
      }
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to encrypt proof thresholds.')
      return null
    }
  }, [canEncrypt, encryptWith, selectedSettlementAsset])

  const generateProof = useCallback(async (input: {
    maxAmount: string
    minAmount: string
    months: string
    proofType: SalaryProofType
    validityDays: number
  }) => {
    if (!address || !companyId || !salaryProofAddress) {
      toast.error('Wallet, company, or SalaryProof contract is not ready.')
      return false
    }

    const encryptedThresholds = await encryptProofThresholds(input.proofType, input.minAmount, input.maxAmount)
    if (!encryptedThresholds) {
      return false
    }

    setPendingAction('generate')

    try {
      const hash = await mutateAsync({
        abi: SalaryProof.abi,
        address: salaryProofAddress,
        functionName: 'generateProof',
        args: [
          companyId,
          proofTypeToEnum[input.proofType],
          encryptedThresholds.minHandle,
          encryptedThresholds.maxHandle,
          encryptedThresholds.inputProof,
          Number(input.months || 0),
          input.validityDays,
        ],
        account: address,
      })
      await waitForReceipt(hash)
      await refetchSalaryProofData()
      toast.success('Salary proof generated on-chain.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to generate salary proof.')
      return false
    }
    finally {
      setPendingAction(null)
    }
  }, [address, companyId, encryptProofThresholds, mutateAsync, refetchSalaryProofData, salaryProofAddress, waitForReceipt])

  const revokeProof = useCallback(async (proofId: bigint) => {
    if (!address || !salaryProofAddress) {
      toast.error('Wallet or SalaryProof contract is not ready.')
      return false
    }

    setPendingAction(`revoke:${proofId.toString()}`)

    try {
      const hash = await mutateAsync({
        abi: SalaryProof.abi,
        address: salaryProofAddress,
        functionName: 'revokeProof',
        args: [proofId],
        account: address,
      })
      await waitForReceipt(hash)
      await refetchSalaryProofData()
      toast.success('Salary proof revoked.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to revoke salary proof.')
      return false
    }
    finally {
      setPendingAction(null)
    }
  }, [address, mutateAsync, refetchSalaryProofData, salaryProofAddress, waitForReceipt])

  const authorizeVerifier = useCallback(async (proofId: bigint, verifier: string) => {
    if (!address || !salaryProofAddress) {
      toast.error('Wallet or SalaryProof contract is not ready.')
      return false
    }
    if (!isAddress(verifier)) {
      toast.error('Enter a valid verifier address.')
      return false
    }

    setPendingAction(`authorize:${proofId.toString()}`)

    try {
      const hash = await mutateAsync({
        abi: SalaryProof.abi,
        address: salaryProofAddress,
        functionName: 'authorizeVerifier',
        args: [proofId, verifier],
        account: address,
      })
      await waitForReceipt(hash)
      toast.success('Verifier authorized.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to authorize verifier.')
      return false
    }
    finally {
      setPendingAction(null)
    }
  }, [address, mutateAsync, salaryProofAddress, waitForReceipt])

  const mintProofNFT = useCallback(async (proofId: bigint, tokenURI: string) => {
    if (!address || !salaryProofAddress) {
      toast.error('Wallet or SalaryProof contract is not ready.')
      return false
    }

    setPendingAction(`mint:${proofId.toString()}`)

    try {
      const hash = await mutateAsync({
        abi: SalaryProof.abi,
        address: salaryProofAddress,
        functionName: 'mintProofNFT',
        args: [proofId, tokenURI],
        account: address,
      })
      await waitForReceipt(hash)
      await refetchSalaryProofData()
      toast.success('RWA NFT minted on-chain.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to mint RWA NFT.')
      return false
    }
    finally {
      setPendingAction(null)
    }
  }, [address, mutateAsync, refetchSalaryProofData, salaryProofAddress, waitForReceipt])

  return {
    authorizeVerifier,
    canEncrypt,
    decryptProofResult: proofResultDecrypt.decryptRequest,
    isDecryptingProofResult: proofResultDecrypt.isDecryptingRequest,
    generateProof,
    mintProofNFT,
    pendingAction,
    proofNFTAbi: ProofNFT.abi,
    refetchSalaryProofData,
    revokeProof,
    rows,
    salaryProofAddress,
  }
}
