'use client'

import type { CompanySummary } from '@/contexts'
import type { Address, Hex } from 'viem'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { formatUnits, zeroAddress, zeroHash } from 'viem'
import { useConnection, useContractEvents, useReadContracts, useWatchContractEvent } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { CompanyTreasuryVault } from '@/contract-data/company-treasury-vault'
import { ERC7984Wrapper } from '@/contract-data/erc7984-wrapper'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { RolesEnum } from '@/enums'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useCompanyEmployees } from './use-company-employees'

interface PayrollSchedule {
  daysLeft: number
  nextPayrollDate: string
  periodProgress: number
}

export interface EmployeePayrollHistoryItem {
  amount: string | null
  amountHandle: Hex | null
  executedAt: number
  transactionHash: Hex
}

interface PayrollTransferredLog {
  args: {
    executedAt?: bigint
  }
  transactionHash: Hex
}

interface ConfidentialTransferLog {
  args: {
    amount?: Hex
  }
  transactionHash: Hex
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
  const balanceContracts = useMemo((): any[] => {
    if (!selectedSettlementAsset?.settlementToken || !currentEmployee?.payoutWallet) {
      return []
    }

    return [
      {
        abi: ERC7984Wrapper.abi,
        address: selectedSettlementAsset.settlementToken as Address,
        functionName: 'confidentialBalanceOf',
        args: [currentEmployee.payoutWallet],
      },
    ]
  }, [currentEmployee?.payoutWallet, selectedSettlementAsset?.settlementToken])
  const {
    data: balanceResults,
    isLoading: isLoadingBalanceHandle,
    refetch: refetchBalanceHandle,
  } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: balanceContracts.length > 0,
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
  const employeeBalanceHandle = useMemo(() => {
    const result = balanceResults?.[0]
    return result?.status === 'success' && isActiveSalaryHandle(result.result) ? result.result : null
  }, [balanceResults])
  const treasuryVault = useMemo(() => {
    const result = overviewResults?.[1]
    return result?.status === 'success' && typeof result.result === 'string' ? result.result : zeroAddress
  }, [overviewResults])
  const treasuryVaultConfigured = treasuryVault !== zeroAddress
  const canReadEmployeePayrollHistory = Boolean(
    companyId
    && currentEmployee?.payoutWallet
    && selectedSettlementAsset?.settlementToken
    && treasuryVaultConfigured,
  )
  const payrollHistoryEventArgs = useMemo(() => {
    if (!companyId || !currentEmployee?.payoutWallet) {
      return undefined
    }

    return {
      companyId,
      to: currentEmployee.payoutWallet,
    }
  }, [companyId, currentEmployee?.payoutWallet])
  const transferHistoryEventArgs = useMemo(() => {
    if (!currentEmployee?.payoutWallet || !treasuryVaultConfigured) {
      return undefined
    }

    return {
      from: treasuryVault as Address,
      to: currentEmployee.payoutWallet,
    }
  }, [currentEmployee?.payoutWallet, treasuryVault, treasuryVaultConfigured])
  const {
    data: payrollEventLogs,
    error: payrollEventLogsError,
    isLoading: isLoadingPayrollEventLogs,
    refetch: refetchPayrollEventLogs,
  } = useContractEvents({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault as Address : undefined,
    eventName: 'PayrollTransferred',
    args: payrollHistoryEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: canReadEmployeePayrollHistory,
    },
  })
  const {
    data: transferEventLogs,
    error: transferEventLogsError,
    isLoading: isLoadingTransferEventLogs,
    refetch: refetchTransferEventLogs,
  } = useContractEvents({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    eventName: 'ConfidentialTransfer',
    args: transferHistoryEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: canReadEmployeePayrollHistory,
    },
  })
  const refetchEmployeePayrollHistory = useCallback(async () => {
    if (!canReadEmployeePayrollHistory) {
      return
    }

    await Promise.all([
      refetchPayrollEventLogs(),
      refetchTransferEventLogs(),
    ])
  }, [canReadEmployeePayrollHistory, refetchPayrollEventLogs, refetchTransferEventLogs])

  useWatchContractEvent({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault as Address : undefined,
    eventName: 'PayrollTransferred',
    args: payrollHistoryEventArgs,
    enabled: canReadEmployeePayrollHistory,
    onLogs: () => {
      void refetchEmployeePayrollHistory()
    },
  })
  useWatchContractEvent({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    eventName: 'ConfidentialTransfer',
    args: transferHistoryEventArgs,
    enabled: canReadEmployeePayrollHistory,
    onLogs: () => {
      void refetchEmployeePayrollHistory()
      void refetchBalanceHandle()
    },
  })

  const employeePayrollHistory = useMemo(() => {
    if (!canReadEmployeePayrollHistory) {
      return []
    }

    const decodedTransferLogs = (transferEventLogs ?? []) as ConfidentialTransferLog[]
    const decodedPayrollLogs = (payrollEventLogs ?? []) as PayrollTransferredLog[]
    const transferByTransactionHash = new Map<Hex, Hex>()

    for (const transferLog of decodedTransferLogs) {
      const amount = transferLog.args.amount
      if (isActiveSalaryHandle(amount)) {
        transferByTransactionHash.set(transferLog.transactionHash, amount)
      }
    }

    return decodedPayrollLogs
      .map((payrollLog) => {
        const amountHandle = transferByTransactionHash.get(payrollLog.transactionHash) ?? null
        return {
          amount: null,
          amountHandle,
          executedAt: Number(payrollLog.args.executedAt ?? 0),
          transactionHash: payrollLog.transactionHash,
        } satisfies EmployeePayrollHistoryItem
      })
      .sort((a, b) => b.executedAt - a.executedAt)
  }, [canReadEmployeePayrollHistory, payrollEventLogs, transferEventLogs])
  const isLoadingEmployeePayrollHistory = isLoadingPayrollEventLogs || isLoadingTransferEventLogs
  const employeePayrollHistoryError = payrollEventLogsError || transferEventLogsError
    ? 'Failed to load payroll history events.'
    : null

  const decryptRequests = useMemo(() => {
    if (selectedCompany?.role === RolesEnum.Employee) {
      const settlementTokenAddress = selectedSettlementAsset?.settlementToken as Address | undefined
      const requests = [
        employeeSalaryHandle
          ? {
              handle: employeeSalaryHandle,
              contractAddress: SalaryCipherCore.address,
            }
          : null,
        employeeBalanceHandle && settlementTokenAddress
          ? {
              handle: employeeBalanceHandle,
              contractAddress: settlementTokenAddress,
            }
          : null,
        ...employeePayrollHistory.map(item => item.amountHandle && settlementTokenAddress
          ? {
              handle: item.amountHandle,
              contractAddress: settlementTokenAddress,
            }
          : null),
      ].filter((request): request is { handle: Hex, contractAddress: Address } => Boolean(request))

      return requests.length > 0 ? requests : undefined
    }

    const requests = salaryHandles
      .map(item => item.handle
        ? {
            handle: item.handle,
            contractAddress: SalaryCipherCore.address,
          }
        : null)
      .filter((request): request is { handle: Hex, contractAddress: Address } => Boolean(request))

    return requests.length > 0 ? requests : undefined
  }, [
    employeeBalanceHandle,
    employeePayrollHistory,
    employeeSalaryHandle,
    salaryHandles,
    selectedCompany?.role,
    selectedSettlementAsset?.settlementToken,
  ])
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
  const employeeConfidentialBalance = useMemo(() => {
    if (!employeeBalanceHandle) {
      return null
    }

    return toTokenAmount(decryptedSalaryByHandle[employeeBalanceHandle], selectedSettlementAsset?.decimals ?? 6)
  }, [decryptedSalaryByHandle, employeeBalanceHandle, selectedSettlementAsset?.decimals])
  const employeePayrollHistoryWithAmounts = useMemo(() => {
    const decimals = selectedSettlementAsset?.decimals ?? 6
    return employeePayrollHistory.map(item => ({
      ...item,
      amount: item.amountHandle ? toTokenAmount(decryptedSalaryByHandle[item.amountHandle], decimals) : null,
    }))
  }, [decryptedSalaryByHandle, employeePayrollHistory, selectedSettlementAsset?.decimals])
  const employeeTotalReceived = useMemo(() => {
    const total = employeePayrollHistory.reduce((sum, item) => {
      if (!item.amountHandle) {
        return sum
      }

      return sum + toBigIntAmount(decryptedSalaryByHandle[item.amountHandle])
    }, 0n)
    if (total === 0n) {
      return null
    }

    return formatUnits(total, selectedSettlementAsset?.decimals ?? 6)
  }, [decryptedSalaryByHandle, employeePayrollHistory, selectedSettlementAsset?.decimals])
  const missingSalaryCount = useMemo(() => {
    return salaryHandles.filter(item => !item.handle).length
  }, [salaryHandles])
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
    employeeBalanceHandle,
    employeeConfidentialBalance,
    employeePayrollHistory: employeePayrollHistoryWithAmounts,
    employeePayrollHistoryError,
    employeeMonthlySalary,
    employeeSalaryHandle,
    employeeStartDate,
    employeeTotalReceived,
    employees,
    isDecryptingSalary: salaryDecrypt.isDecrypting,
    isLoading: isLoadingEmployees || isLoadingOverview || isLoadingSalaryHandles || isLoadingBalanceHandle || isLoadingEmployeePayrollHistory,
    isLoadingEmployeePayrollHistory,
    lastPayrollTime,
    missingSalaryCount,
    payrollSchedule,
    refetchBalanceHandle,
    refetchEmployeePayrollHistory,
    selectedSettlementAsset,
    salaryDecryptError: salaryDecrypt.error,
    totalMonthlyPayroll,
    treasuryVault,
    treasuryVaultConfigured,
  } as const
}
