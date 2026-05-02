'use client'

import type { AssignableCompanyRole } from '@/constants'
import type { CompanySummary } from '@/contexts'
import type { Address } from 'viem'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { parseUnits, toHex } from 'viem'
import { useConnection, usePublicClient, useWalletClient } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { RolesEnum } from '@/enums'
import { useFHEEncrypt } from './fhevm/use-fhe-encrypt'
import { useStoreContext } from './use-store-context'

export interface AddCompanyEmployeeInput {
  account: Address
  displayName: string
  role: AssignableCompanyRole
  monthlySalary: string
}

export type UpdateCompanyEmployeeInput = AddCompanyEmployeeInput

export interface CompanyEmployee {
  account: Address
  addedAt: number
  displayName: string
  payoutWallet: Address
  role: RolesEnum
}

interface CompanyEmployeeRecord {
  addedAt: bigint
  displayName: string
  payoutWallet: Address
  role: RolesEnum
}

function filterEmployees<T extends CompanyEmployee>(value: T | null): value is T {
  return value !== null && value.role !== RolesEnum.Owner
}

/**
 * Loads and mutates the selected company's people list from the on-chain registry.
 */
export function useCompanyEmployees(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { settlementAssets, refreshCompanies } = useStoreContext()
  const { canEncrypt, encryptWith } = useFHEEncrypt({
    contractAddress: SalaryCipherCore.address,
  })

  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState<Address | null>(null)

  const selectedSettlementAsset = useMemo(() => {
    if (!selectedCompany) {
      return null
    }

    return settlementAssets.find(asset => asset.value === selectedCompany.settlementAsset) ?? null
  }, [selectedCompany, settlementAssets])

  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null

  const loadEmployees = useCallback(async () => {
    if (!publicClient || !companyId) {
      setEmployees([])
      return
    }

    setIsLoadingEmployees(true)

    try {
      const employeeAccounts = await publicClient.readContract({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'getEmployees',
        args: [companyId],
      }) as Address[]

      const employeeRecords = await Promise.all(
        employeeAccounts.map(async (employeeAccount) => {
          try {
            const employee = await publicClient.readContract({
              abi: CompanyRegistry.abi,
              address: CompanyRegistry.address,
              functionName: 'getEmployee',
              args: [companyId, employeeAccount],
            }) as CompanyEmployeeRecord

            return {
              account: employeeAccount,
              addedAt: Number(employee.addedAt),
              displayName: employee.displayName,
              payoutWallet: employee.payoutWallet,
              role: employee.role,
            } satisfies CompanyEmployee
          }
          catch (error) {
            console.error(error)
            return null
          }
        }),
      )

      setEmployees(employeeRecords.filter(filterEmployees))
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to load employees from chain.')
      setEmployees([])
    }
    finally {
      setIsLoadingEmployees(false)
    }
  }, [companyId, publicClient])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  const addEmployee = useCallback(async (input: AddCompanyEmployeeInput) => {
    if (!walletClient || !publicClient || !address || !companyId || !selectedSettlementAsset) {
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

      const addEmployeeHash = await walletClient.writeContract({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'addEmployee',
        args: [companyId, input.account, input.role, input.displayName],
        account: address,
      })
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      try {
        const setSalaryHash = await walletClient.writeContract({
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
        await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })
      }
      catch (error) {
        console.error(error)
        await Promise.all([loadEmployees(), refreshCompanies()])
        toast.error('Employee added, but encrypted salary was not set.')
        return true
      }

      await Promise.all([loadEmployees(), refreshCompanies()])
      toast.success('Employee added.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to add employee.')
      await loadEmployees()
      return false
    }
    finally {
      setIsAddingEmployee(false)
    }
  }, [
    address,
    companyId,
    encryptWith,
    loadEmployees,
    publicClient,
    refreshCompanies,
    selectedSettlementAsset,
    walletClient,
  ])

  const deleteEmployee = useCallback(async (employeeAccount: Address) => {
    if (!walletClient || !publicClient || !address || !companyId) {
      toast.error('Wallet or company is not ready.')
      return false
    }

    setDeletingEmployee(employeeAccount)

    try {
      const hash = await walletClient.writeContract({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'removeEmployee',
        args: [companyId, employeeAccount],
        account: address,
      })
      await publicClient.waitForTransactionReceipt({ hash })

      await Promise.all([loadEmployees(), refreshCompanies()])
      toast.success('Employee removed.')
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
  }, [address, companyId, loadEmployees, publicClient, refreshCompanies, walletClient])

  const updateEmployee = useCallback(async (input: UpdateCompanyEmployeeInput) => {
    if (!walletClient || !publicClient || !address || !companyId || !selectedSettlementAsset) {
      toast.error('Wallet, company, or settlement asset is not ready.')
      return false
    }

    setIsUpdatingEmployee(true)

    try {
      const salaryAmount = parseUnits(input.monthlySalary, selectedSettlementAsset.decimals)
      const encryptedSalary = await encryptWith(builder => builder.add128(salaryAmount))

      if (!encryptedSalary) {
        toast.error('FHE encryption is not ready.')
        return false
      }

      const updateEmployeeHash = await walletClient.writeContract({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'updateEmployee',
        args: [companyId, input.account, input.role, input.displayName],
        account: address,
      })
      await publicClient.waitForTransactionReceipt({ hash: updateEmployeeHash })

      const setSalaryHash = await walletClient.writeContract({
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
      await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

      await Promise.all([loadEmployees(), refreshCompanies()])
      toast.success('Employee updated.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to update employee.')
      await loadEmployees()
      return false
    }
    finally {
      setIsUpdatingEmployee(false)
    }
  }, [
    address,
    companyId,
    encryptWith,
    loadEmployees,
    publicClient,
    refreshCompanies,
    selectedSettlementAsset,
    walletClient,
  ])

  return {
    canEncryptSalary: canEncrypt,
    deleteEmployee,
    deletingEmployee,
    employees,
    isAddingEmployee,
    isLoadingEmployees,
    isUpdatingEmployee,
    refreshEmployees: loadEmployees,
    selectedSettlementAsset,
    addEmployee,
    updateEmployee,
  } as const
}
