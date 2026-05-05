'use client'

import type { AssignableCompanyRole } from '@/constants'
import type { CompanySummary } from '@/contexts'
import type { Address, Hash, Hex } from 'viem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits, parseUnits, toHex, zeroAddress, zeroHash } from 'viem'
import { useConnection, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { RolesEnum } from '@/enums'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useFHEEncrypt } from './fhevm/use-fhe-encrypt'
import { useStoreContext } from './use-store-context'

export interface AddCompanyEmployeeInput {
  account: Address
  displayName: string
  role: AssignableCompanyRole
  monthlySalary: string
}

export type UpdateCompanyEmployeeInput = Omit<AddCompanyEmployeeInput, 'monthlySalary'>

export interface CompanyEmployee {
  account: Address
  addedAt: number
  displayName: string
  monthlySalary: string | null
  monthlySalaryHandle: Hex | null
  payoutWallet: Address
  role: RolesEnum
}

interface CompanyEmployeeRecord {
  addedAt: bigint
  displayName: string
  payoutWallet: Address
  role: RolesEnum
}

interface ReceiptWaiter {
  hash: Hash
  resolve: () => void
  reject: (error: Error) => void
}

const DECIMAL_STRING_REGEX = /^\d+$/

function filterEmployees<T extends CompanyEmployee>(value: T | null): value is T {
  return value !== null && value.role !== RolesEnum.Owner
}

function isActiveHandle(value: unknown): value is Hex {
  return typeof value === 'string' && value !== '0x' && value !== zeroAddress && value !== zeroHash
}

function getDecryptedValue(results: Record<string, string | bigint | boolean>, handle: Hex) {
  return results[handle] ?? results[handle.toLowerCase()] ?? results[handle.toUpperCase()]
}

function toTokenAmount(value: bigint | string | boolean | undefined, decimals: number) {
  if (typeof value === 'bigint') {
    return formatUnits(value, decimals)
  }
  if (typeof value === 'string' && DECIMAL_STRING_REGEX.test(value)) {
    return formatUnits(BigInt(value), decimals)
  }
  return null
}

/**
 * Loads and mutates the selected company's people list from the on-chain registry.
 */
export function useCompanyEmployees(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const { mutateAsync } = useWriteContract()
  const { settlementAssets, refreshCompanies } = useStoreContext()
  const { canEncrypt, encryptWith } = useFHEEncrypt({
    contractAddress: SalaryCipherCore.address,
  })

  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState<Address | null>(null)

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

  const selectedSettlementAsset = useMemo(() => {
    if (!selectedCompany) {
      return null
    }

    return settlementAssets.find(asset => asset.value === selectedCompany.settlementAsset) ?? null
  }, [selectedCompany, settlementAssets])

  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null

  const {
    data: employeeAccounts = [],
    error: employeeAccountsError,
    isLoading: isLoadingEmployeeAccounts,
    refetch: refetchEmployeeAccounts,
  } = useReadContract({
    abi: CompanyRegistry.abi,
    address: CompanyRegistry.address,
    functionName: 'getEmployees',
    args: companyId ? [companyId] : undefined,
    query: {
      enabled: companyId !== null,
    },
  })

  const employeeAccountList = useMemo(() => employeeAccounts as Address[], [employeeAccounts])

  const employeeContracts = useMemo(() => {
    if (!companyId) {
      return []
    }

    return employeeAccountList.map(employeeAccount => ({
      abi: CompanyRegistry.abi,
      address: CompanyRegistry.address,
      functionName: 'getEmployee',
      args: [companyId, employeeAccount],
    }) as const)
  }, [companyId, employeeAccountList])

  const {
    data: employeeResults,
    error: employeeRecordsError,
    isLoading: isLoadingEmployeeRecords,
    refetch: refetchEmployeeRecords,
  } = useReadContracts({
    contracts: employeeContracts,
    query: {
      enabled: employeeContracts.length > 0,
    },
  })

  const salaryContracts = useMemo(() => {
    if (!companyId) {
      return []
    }

    return employeeAccountList.map(employeeAccount => ({
      abi: SalaryCipherCore.abi,
      address: SalaryCipherCore.address,
      functionName: 'monthlySalary',
      args: [companyId, employeeAccount],
    }) as const)
  }, [companyId, employeeAccountList])

  const {
    data: salaryResults,
    isLoading: isLoadingSalaryHandles,
    refetch: refetchSalaryHandles,
  } = useReadContracts({
    contracts: salaryContracts,
    query: {
      enabled: salaryContracts.length > 0,
    },
  })

  const salaryHandles = useMemo(() => {
    return employeeAccountList.map((employeeAccount, index) => {
      const result = salaryResults?.[index]
      return {
        account: employeeAccount,
        handle: result?.status === 'success' && isActiveHandle(result.result) ? result.result : null,
      }
    })
  }, [employeeAccountList, salaryResults])

  const salaryDecryptRequests = useMemo(() => {
    const canReadAllSalaries = selectedCompany?.role === RolesEnum.Owner || selectedCompany?.role === RolesEnum.HR
    const readableHandles = salaryHandles
      .filter(({ account }) => canReadAllSalaries || account.toLowerCase() === address?.toLowerCase())
      .map(({ handle }) => handle
        ? {
            contractAddress: SalaryCipherCore.address,
            handle,
          }
        : null)
      .filter((request): request is { contractAddress: Address, handle: Hex } => Boolean(request))

    return readableHandles.length > 0 ? readableHandles : undefined
  }, [address, salaryHandles, selectedCompany?.role])

  const salaryDecrypt = useFHEDecrypt({
    requests: salaryDecryptRequests,
  })

  const employees = useMemo(() => {
    return (employeeResults ?? []).map((employeeResult, index) => {
      if (employeeResult.status !== 'success') {
        return null
      }

      const employee = employeeResult.result as CompanyEmployeeRecord
      const salaryHandle = salaryHandles[index]?.handle ?? null
      return {
        account: employeeAccountList[index],
        addedAt: Number(employee.addedAt),
        displayName: employee.displayName,
        monthlySalary: salaryHandle
          ? toTokenAmount(getDecryptedValue(salaryDecrypt.results, salaryHandle), selectedSettlementAsset?.decimals ?? 6)
          : null,
        monthlySalaryHandle: salaryHandle,
        payoutWallet: employee.payoutWallet,
        role: employee.role,
      } satisfies CompanyEmployee
    }).filter(filterEmployees)
  }, [employeeAccountList, employeeResults, salaryDecrypt.results, salaryHandles, selectedSettlementAsset?.decimals])

  const isLoadingEmployees = isLoadingEmployeeAccounts || isLoadingEmployeeRecords || isLoadingSalaryHandles

  const refetchEmployees = useCallback(async () => {
    await refetchEmployeeAccounts()
    await refetchEmployeeRecords()
    await refetchSalaryHandles()
  }, [refetchEmployeeAccounts, refetchEmployeeRecords, refetchSalaryHandles])

  useEffect(() => {
    if (employeeAccountsError || employeeRecordsError) {
      console.error(employeeAccountsError ?? employeeRecordsError)
      toast.error('Failed to load employees from chain.')
    }
  }, [employeeAccountsError, employeeRecordsError])

  const addEmployee = useCallback(async (input: AddCompanyEmployeeInput) => {
    if (!address || !companyId || !selectedSettlementAsset) {
      toast.error('Wallet, company, or settlement asset is not ready.')
      return false
    }

    setIsAddingEmployee(true)

    try {
      const salaryAmount = parseUnits(input.monthlySalary, selectedSettlementAsset.decimals)
      const encryptedSalary = await encryptWith(builder => builder.add128(salaryAmount))

      if (!encryptedSalary) {
        toast.error('FHE encryption is not ready.')
        return false
      }

      const addEmployeeHash = await mutateAsync({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'addEmployee',
        args: [companyId, input.account, input.role, input.displayName],
        account: address,
      })
      await waitForReceipt(addEmployeeHash)

      try {
        const setSalaryHash = await mutateAsync({
          abi: SalaryCipherCore.abi,
          address: SalaryCipherCore.address,
          functionName: 'setSalary',
          args: [
            companyId,
            input.account,
            toHex(encryptedSalary.handles[0]),
            toHex(encryptedSalary.inputProof),
          ],
          account: address,
        })
        await waitForReceipt(setSalaryHash)
      }
      catch (error) {
        console.error(error)
        await Promise.all([refetchEmployees(), refreshCompanies()])
        toast.error('Employee added, but encrypted salary was not set.')
        return true
      }

      await Promise.all([refetchEmployees(), refreshCompanies()])
      toast.success('Employee added.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to add employee.')
      await refetchEmployees()
      return false
    }
    finally {
      setIsAddingEmployee(false)
    }
  }, [
    address,
    companyId,
    encryptWith,
    refetchEmployees,
    refreshCompanies,
    selectedSettlementAsset,
    mutateAsync,
    waitForReceipt,
  ])

  const deleteEmployee = useCallback(async (employeeAccount: Address) => {
    if (!address || !companyId) {
      toast.error('Wallet or company is not ready.')
      return false
    }

    setDeletingEmployee(employeeAccount)

    try {
      const hash = await mutateAsync({
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'terminateEmployee',
        args: [companyId, employeeAccount],
        account: address,
      })
      await waitForReceipt(hash)

      await Promise.all([refetchEmployees(), refreshCompanies()])
      toast.success('Employee terminated and final salary settled.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to remove employee.')
      return false
    }
    finally {
      setDeletingEmployee(null)
    }
  }, [address, companyId, refetchEmployees, refreshCompanies, mutateAsync, waitForReceipt])

  const updateEmployee = useCallback(async (input: UpdateCompanyEmployeeInput) => {
    if (!address || !companyId) {
      toast.error('Wallet or company is not ready.')
      return false
    }

    setIsUpdatingEmployee(true)

    try {
      const updateEmployeeHash = await mutateAsync({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'updateEmployee',
        args: [companyId, input.account, input.role, input.displayName],
        account: address,
      })
      await waitForReceipt(updateEmployeeHash)

      await Promise.all([refetchEmployees(), refreshCompanies()])
      toast.success('Employee updated.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to update employee.')
      await refetchEmployees()
      return false
    }
    finally {
      setIsUpdatingEmployee(false)
    }
  }, [
    address,
    companyId,
    refetchEmployees,
    refreshCompanies,
    mutateAsync,
    waitForReceipt,
  ])
  const decryptSalaryHandle = useCallback((handle: Hex) => {
    salaryDecrypt.decryptRequest({
      contractAddress: SalaryCipherCore.address,
      handle,
    })
  }, [salaryDecrypt])
  const isDecryptingSalaryHandle = useCallback((handle: Hex) => {
    return salaryDecrypt.isDecryptingRequest({
      contractAddress: SalaryCipherCore.address,
      handle,
    })
  }, [salaryDecrypt])

  return {
    canEncryptSalary: canEncrypt,
    canDecryptSalary: salaryDecrypt.canDecrypt,
    decryptSalaryHandle,
    decryptSalary: salaryDecrypt.decrypt,
    deleteEmployee,
    deletingEmployee,
    employees,
    isAddingEmployee,
    isDecryptingSalaryHandle,
    isDecryptingSalary: salaryDecrypt.isDecrypting,
    isLoadingEmployees,
    isUpdatingEmployee,
    refreshEmployees: refetchEmployees,
    salaryDecryptError: salaryDecrypt.error,
    selectedSettlementAsset,
    addEmployee,
    updateEmployee,
  } as const
}
