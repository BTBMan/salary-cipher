'use client'

import type { CompanySummary } from '@/contexts'
import type { Hex } from 'viem'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { formatUnits, zeroAddress, zeroHash } from 'viem'
import { useConnection, useReadContracts } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { RolesEnum } from '@/enums'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useCompanyEmployees } from './use-company-employees'

interface PayrollSchedule {
  daysLeft: number
  nextPayrollDate: string
  periodProgress: number
}

const DECIMAL_STRING_REGEX = /^\d+$/

function getPayrollDateForMonth(reference: dayjs.Dayjs, dayOfMonth: number) {
  const clampedDay = Math.min(dayOfMonth, reference.daysInMonth())
  return reference.date(clampedDay).startOf('day')
}

function getPayrollSchedule(dayOfMonth: number): PayrollSchedule | null {
  if (!dayOfMonth) {
    return null
  }

  const today = dayjs()
  const todayStart = today.startOf('day')
  const currentMonthPayrollDate = getPayrollDateForMonth(today, dayOfMonth)
  const nextPayrollDate = today.isBefore(currentMonthPayrollDate)
    ? currentMonthPayrollDate
    : getPayrollDateForMonth(today.add(1, 'month'), dayOfMonth)
  const previousPayrollDate = getPayrollDateForMonth(nextPayrollDate.subtract(1, 'month'), dayOfMonth)
  const totalDays = Math.max(nextPayrollDate.diff(previousPayrollDate, 'day'), 1)
  const elapsedDays = Math.min(Math.max(todayStart.diff(previousPayrollDate, 'day'), 0), totalDays)

  return {
    daysLeft: Math.max(nextPayrollDate.diff(todayStart, 'day'), 0),
    nextPayrollDate: nextPayrollDate.format('MMM DD, YYYY'),
    periodProgress: Math.round((elapsedDays / totalDays) * 100),
  }
}

function isActiveSalaryHandle(handle: unknown): handle is Hex {
  return typeof handle === 'string' && handle !== zeroAddress && handle !== zeroHash
}

function toTokenAmount(value: string | bigint | boolean | undefined, decimals: number) {
  if (typeof value === 'bigint') {
    return formatUnits(value, decimals)
  }
  if (typeof value === 'string' && DECIMAL_STRING_REGEX.test(value)) {
    return formatUnits(BigInt(value), decimals)
  }
  return null
}

function toBigIntAmount(value: string | bigint | boolean | undefined) {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'string' && DECIMAL_STRING_REGEX.test(value)) {
    return BigInt(value)
  }
  return 0n
}

export function useOverviewChainData(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const {
    employees,
    isLoadingEmployees,
    selectedSettlementAsset,
  } = useCompanyEmployees(selectedCompany)
  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null
  const payrollSchedule = useMemo(() => {
    return getPayrollSchedule(selectedCompany?.payrollDayOfMonth ?? 0)
  }, [selectedCompany?.payrollDayOfMonth])
  const currentEmployee = useMemo(() => {
    if (!address) {
      return null
    }

    return employees.find(employee => employee.account.toLowerCase() === address.toLowerCase()) ?? null
  }, [address, employees])
  const salaryContracts = useMemo((): any[] => {
    if (!companyId) {
      return []
    }

    return employees.map(employee => ({
      abi: SalaryCipherCore.abi,
      address: SalaryCipherCore.address,
      functionName: 'monthlySalary',
      args: [companyId, employee.account],
    }) as const)
  }, [companyId, employees])
  const overviewContracts = useMemo((): any[] => {
    if (!companyId || !address) {
      return []
    }

    return [
      {
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'getPayrollConfig',
        args: [companyId],
      },
      {
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'getTreasuryVault',
        args: [companyId],
      },
      {
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'lastPayrollTime',
        args: [companyId],
      },
      {
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'startDate',
        args: [companyId, address],
      },
      {
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'monthlySalary',
        args: [companyId, address],
      },
    ]
  }, [address, companyId])
  const {
    data: overviewResults,
    isLoading: isLoadingOverview,
  } = useReadContracts({
    contracts: overviewContracts,
    query: {
      enabled: overviewContracts.length > 0,
    },
  })
  const {
    data: salaryResults,
    isLoading: isLoadingSalaryHandles,
  } = useReadContracts({
    contracts: salaryContracts,
    query: {
      enabled: salaryContracts.length > 0,
    },
  })
  const salaryHandles = useMemo(() => {
    return employees.map((employee, index) => {
      const result = salaryResults?.[index]
      return {
        employee,
        handle: result?.status === 'success' && isActiveSalaryHandle(result.result) ? result.result : null,
      }
    })
  }, [employees, salaryResults])
  const employeeSalaryHandle = useMemo(() => {
    const result = overviewResults?.[4]
    return result?.status === 'success' && isActiveSalaryHandle(result.result) ? result.result : null
  }, [overviewResults])
  const decryptRequests = useMemo(() => {
    const handles = selectedCompany?.role === RolesEnum.Employee
      ? [employeeSalaryHandle]
      : salaryHandles.map(item => item.handle)
    const requests = handles
      .filter((handle): handle is Hex => Boolean(handle))
      .map(handle => ({
        handle,
        contractAddress: SalaryCipherCore.address,
      }))

    return requests.length > 0 ? requests : undefined
  }, [employeeSalaryHandle, salaryHandles, selectedCompany?.role])
  const salaryDecrypt = useFHEDecrypt({
    requests: decryptRequests,
  })
  const decryptedSalaryByHandle = salaryDecrypt.results
  const decryptedSalaryRows = useMemo(() => {
    const decimals = selectedSettlementAsset?.decimals ?? 6
    return salaryHandles.map(({ employee, handle }) => ({
      employee,
      handle,
      amount: handle ? toTokenAmount(decryptedSalaryByHandle[handle], decimals) : null,
      rawAmount: handle ? toBigIntAmount(decryptedSalaryByHandle[handle]) : 0n,
    }))
  }, [decryptedSalaryByHandle, salaryHandles, selectedSettlementAsset?.decimals])
  const totalMonthlyPayroll = useMemo(() => {
    const total = decryptedSalaryRows.reduce((sum, row) => sum + row.rawAmount, 0n)
    if (total === 0n) {
      return null
    }

    return formatUnits(total, selectedSettlementAsset?.decimals ?? 6)
  }, [decryptedSalaryRows, selectedSettlementAsset?.decimals])
  const employeeMonthlySalary = useMemo(() => {
    if (!employeeSalaryHandle) {
      return null
    }

    return toTokenAmount(decryptedSalaryByHandle[employeeSalaryHandle], selectedSettlementAsset?.decimals ?? 6)
  }, [decryptedSalaryByHandle, employeeSalaryHandle, selectedSettlementAsset?.decimals])
  const missingSalaryCount = useMemo(() => {
    return salaryHandles.filter(item => !item.handle).length
  }, [salaryHandles])
  const treasuryVault = useMemo(() => {
    const result = overviewResults?.[1]
    return result?.status === 'success' && typeof result.result === 'string' ? result.result : zeroAddress
  }, [overviewResults])
  const lastPayrollTime = useMemo(() => {
    const result = overviewResults?.[2]
    return result?.status === 'success' ? Number(result.result) : 0
  }, [overviewResults])
  const employeeStartDate = useMemo(() => {
    const result = overviewResults?.[3]
    return result?.status === 'success' ? Number(result.result) : 0
  }, [overviewResults])

  return {
    canDecryptSalary: salaryDecrypt.canDecrypt,
    currentEmployee,
    decryptSalary: salaryDecrypt.decrypt,
    decryptedSalaryRows,
    employeeMonthlySalary,
    employeeSalaryHandle,
    employeeStartDate,
    employees,
    isDecryptingSalary: salaryDecrypt.isDecrypting,
    isLoading: isLoadingEmployees || isLoadingOverview || isLoadingSalaryHandles,
    lastPayrollTime,
    missingSalaryCount,
    payrollSchedule,
    selectedSettlementAsset,
    salaryDecryptError: salaryDecrypt.error,
    totalMonthlyPayroll,
    treasuryVault,
    treasuryVaultConfigured: treasuryVault !== zeroAddress,
  } as const
}
