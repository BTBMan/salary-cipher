'use client'

import type { CompanySummary } from '@/contexts'
import type { Address, Hex } from 'viem'
import { useCallback, useMemo } from 'react'
import { formatUnits, isAddress, zeroAddress, zeroHash } from 'viem'
import { useConnection, useContractEvents, useReadContracts, useWatchContractEvent } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { CompanyTreasuryVault } from '@/contract-data/company-treasury-vault'
import { ERC7984Wrapper } from '@/contract-data/erc7984-wrapper'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { RolesEnum } from '@/enums'
import { getPayrollSchedule } from '@/utils'
import { useFHEDecrypt } from './fhevm/use-fhe-decrypt'
import { useCompanyEmployees } from './use-company-employees'

export interface EmployeePayrollHistoryItem {
  amount: string | null
  amountHandle: Hex | null
  executedAt: number
  transactionHash: Hex
}

export interface CompanyPayrollHistoryItem {
  amount: string | null
  amountHandle: Hex | null
  executedAt: number
  recipient: Address
  recipientName: string | null
  transactionHash: Hex
}

interface PayrollTransferredLog {
  args: {
    executedAt?: bigint
    to?: Address
  }
  transactionHash: Hex
}

interface ConfidentialTransferLog {
  args: {
    amount?: Hex
    to?: Address
  }
  transactionHash: Hex
}

const DECIMAL_STRING_REGEX = /^\d+$/
const DEFAULT_PAYROLL_HISTORY_LIMIT = 5

interface UseOverviewChainDataOptions {
  payrollHistoryLimit?: number | null
}

function isActiveSalaryHandle(handle: unknown): handle is Hex {
  return typeof handle === 'string' && handle !== '0x' && handle !== zeroAddress && handle !== zeroHash
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

function getDecryptedValue(results: Record<string, string | bigint | boolean>, handle: Hex) {
  return results[handle] ?? results[handle.toLowerCase()] ?? results[handle.toUpperCase()]
}

function getTransferKey(transactionHash: string, recipient: Address) {
  return `${transactionHash.toLowerCase()}-${recipient.toLowerCase()}`
}

function toEventAddress(value: unknown): Address | null {
  return typeof value === 'string' && isAddress(value) ? value : null
}

export function useOverviewChainData(
  selectedCompany: CompanySummary | null,
  options: UseOverviewChainDataOptions = {},
) {
  const { address } = useConnection()
  const payrollHistoryLimit = options.payrollHistoryLimit === undefined
    ? DEFAULT_PAYROLL_HISTORY_LIMIT
    : options.payrollHistoryLimit
  const {
    employees,
    isLoadingEmployees,
    selectedSettlementAsset,
  } = useCompanyEmployees(selectedCompany)
  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null
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
    refetch: refetchOverview,
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
  const canReadCompanyPayrollHistory = Boolean(
    companyId
    && selectedSettlementAsset?.settlementToken
    && treasuryVaultConfigured
    && selectedCompany?.role !== RolesEnum.Employee,
  )
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
  const companyPayrollHistoryEventArgs = useMemo(() => {
    if (!companyId) {
      return undefined
    }

    return {
      companyId,
    }
  }, [companyId])
  const transferHistoryEventArgs = useMemo(() => {
    if (!currentEmployee?.payoutWallet || !treasuryVaultConfigured) {
      return undefined
    }

    return {
      from: treasuryVault as Address,
      to: currentEmployee.payoutWallet,
    }
  }, [currentEmployee?.payoutWallet, treasuryVault, treasuryVaultConfigured])
  const companyTransferHistoryEventArgs = useMemo(() => {
    if (!treasuryVaultConfigured) {
      return undefined
    }

    return {
      from: treasuryVault as Address,
    }
  }, [treasuryVault, treasuryVaultConfigured])
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
  const {
    data: companyPayrollEventLogs,
    error: companyPayrollEventLogsError,
    isLoading: isLoadingCompanyPayrollEventLogs,
    refetch: refetchCompanyPayrollEventLogs,
  } = useContractEvents({
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault as Address : undefined,
    eventName: 'PayrollTransferred',
    args: companyPayrollHistoryEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: canReadCompanyPayrollHistory,
    },
  })
  const {
    data: companyTransferEventLogs,
    error: companyTransferEventLogsError,
    isLoading: isLoadingCompanyTransferEventLogs,
    refetch: refetchCompanyTransferEventLogs,
  } = useContractEvents({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    eventName: 'ConfidentialTransfer',
    args: companyTransferHistoryEventArgs,
    fromBlock: 0n,
    toBlock: 'latest',
    query: {
      enabled: canReadCompanyPayrollHistory,
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
  const refetchCompanyPayrollHistory = useCallback(async () => {
    if (!canReadCompanyPayrollHistory) {
      return
    }

    await Promise.all([
      refetchCompanyPayrollEventLogs(),
      refetchCompanyTransferEventLogs(),
    ])
  }, [canReadCompanyPayrollHistory, refetchCompanyPayrollEventLogs, refetchCompanyTransferEventLogs])
  const refetchOverviewData = useCallback(async () => {
    await Promise.all([
      refetchOverview(),
      refetchBalanceHandle(),
    ])
  }, [refetchBalanceHandle, refetchOverview])

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
    abi: CompanyTreasuryVault.abi,
    address: treasuryVaultConfigured ? treasuryVault as Address : undefined,
    eventName: 'PayrollTransferred',
    args: companyPayrollHistoryEventArgs,
    enabled: canReadCompanyPayrollHistory,
    onLogs: () => {
      void refetchCompanyPayrollHistory()
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
  useWatchContractEvent({
    abi: ERC7984Wrapper.abi,
    address: selectedSettlementAsset?.settlementToken as Address | undefined,
    eventName: 'ConfidentialTransfer',
    args: companyTransferHistoryEventArgs,
    enabled: canReadCompanyPayrollHistory,
    onLogs: () => {
      void refetchCompanyPayrollHistory()
    },
  })
  useWatchContractEvent({
    abi: SalaryCipherCore.abi,
    address: SalaryCipherCore.address,
    eventName: 'PayrollExecuted',
    args: companyPayrollHistoryEventArgs,
    enabled: Boolean(companyId),
    onLogs: () => {
      void refetchOverviewData()
      void refetchCompanyPayrollHistory()
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
    const transferByTransactionHash = new Map<string, Hex>()

    for (const transferLog of decodedTransferLogs) {
      const amount = transferLog.args.amount
      const recipient = toEventAddress(transferLog.args.to)
      if (isActiveSalaryHandle(amount) && recipient) {
        transferByTransactionHash.set(getTransferKey(transferLog.transactionHash, recipient), amount)
      }
    }

    return decodedPayrollLogs
      .map((payrollLog) => {
        const recipient = toEventAddress(payrollLog.args.to) ?? currentEmployee?.payoutWallet
        const amountHandle = recipient
          ? transferByTransactionHash.get(getTransferKey(payrollLog.transactionHash, recipient)) ?? null
          : null
        return {
          amount: null,
          amountHandle,
          executedAt: Number(payrollLog.args.executedAt ?? 0),
          transactionHash: payrollLog.transactionHash,
        } satisfies EmployeePayrollHistoryItem
      })
      .sort((a, b) => b.executedAt - a.executedAt)
  }, [canReadEmployeePayrollHistory, currentEmployee?.payoutWallet, payrollEventLogs, transferEventLogs])
  const companyPayrollHistory = useMemo(() => {
    if (!canReadCompanyPayrollHistory) {
      return []
    }

    const decodedTransferLogs = (companyTransferEventLogs ?? []) as ConfidentialTransferLog[]
    const decodedPayrollLogs = (companyPayrollEventLogs ?? []) as PayrollTransferredLog[]
    const employeeByPayoutWallet = new Map(
      employees.map(employee => [employee.payoutWallet.toLowerCase(), employee.displayName]),
    )
    const transferByTransactionAndRecipient = new Map<string, Hex>()

    for (const transferLog of decodedTransferLogs) {
      const amount = transferLog.args.amount
      const recipient = toEventAddress(transferLog.args.to)
      if (isActiveSalaryHandle(amount) && recipient) {
        transferByTransactionAndRecipient.set(getTransferKey(transferLog.transactionHash, recipient), amount)
      }
    }

    return decodedPayrollLogs
      .map((payrollLog) => {
        const recipient = toEventAddress(payrollLog.args.to) ?? zeroAddress
        const amountHandle = recipient !== zeroAddress
          ? transferByTransactionAndRecipient.get(getTransferKey(payrollLog.transactionHash, recipient)) ?? null
          : null

        return {
          amount: null,
          amountHandle,
          executedAt: Number(payrollLog.args.executedAt ?? 0),
          recipient,
          recipientName: recipient !== zeroAddress ? employeeByPayoutWallet.get(recipient.toLowerCase()) ?? null : null,
          transactionHash: payrollLog.transactionHash,
        } satisfies CompanyPayrollHistoryItem
      })
      .sort((a, b) => b.executedAt - a.executedAt)
  }, [canReadCompanyPayrollHistory, companyPayrollEventLogs, companyTransferEventLogs, employees])
  const isLoadingEmployeePayrollHistory = isLoadingPayrollEventLogs || isLoadingTransferEventLogs
  const employeePayrollHistoryError = payrollEventLogsError || transferEventLogsError
    ? 'Failed to load payroll history events.'
    : null
  const isLoadingCompanyPayrollHistory = isLoadingCompanyPayrollEventLogs || isLoadingCompanyTransferEventLogs
  const companyPayrollHistoryError = companyPayrollEventLogsError || companyTransferEventLogsError
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
      .concat(
        companyPayrollHistory.map(item => item.amountHandle && selectedSettlementAsset?.settlementToken
          ? {
              handle: item.amountHandle,
              contractAddress: selectedSettlementAsset.settlementToken as Address,
            }
          : null),
      )
      .filter((request): request is { handle: Hex, contractAddress: Address } => Boolean(request))

    return requests.length > 0 ? requests : undefined
  }, [
    employeeBalanceHandle,
    employeePayrollHistory,
    employeeSalaryHandle,
    salaryHandles,
    selectedCompany?.role,
    selectedSettlementAsset?.settlementToken,
    companyPayrollHistory,
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
      amount: handle ? toTokenAmount(getDecryptedValue(decryptedSalaryByHandle, handle), decimals) : null,
      rawAmount: handle ? toBigIntAmount(getDecryptedValue(decryptedSalaryByHandle, handle)) : 0n,
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

    return toTokenAmount(getDecryptedValue(decryptedSalaryByHandle, employeeSalaryHandle), selectedSettlementAsset?.decimals ?? 6)
  }, [decryptedSalaryByHandle, employeeSalaryHandle, selectedSettlementAsset?.decimals])
  const employeeConfidentialBalance = useMemo(() => {
    if (!employeeBalanceHandle) {
      return null
    }

    return toTokenAmount(getDecryptedValue(decryptedSalaryByHandle, employeeBalanceHandle), selectedSettlementAsset?.decimals ?? 6)
  }, [decryptedSalaryByHandle, employeeBalanceHandle, selectedSettlementAsset?.decimals])
  const employeePayrollHistoryWithAmounts = useMemo(() => {
    const decimals = selectedSettlementAsset?.decimals ?? 6
    const rows = employeePayrollHistory.map(item => ({
      ...item,
      amount: item.amountHandle ? toTokenAmount(getDecryptedValue(decryptedSalaryByHandle, item.amountHandle), decimals) : null,
    }))
    return payrollHistoryLimit === null ? rows : rows.slice(0, payrollHistoryLimit)
  }, [decryptedSalaryByHandle, employeePayrollHistory, payrollHistoryLimit, selectedSettlementAsset?.decimals])
  const displayedCompanyPayrollHistory = useMemo(() => {
    const decimals = selectedSettlementAsset?.decimals ?? 6
    const rows = companyPayrollHistory.map(item => ({
      ...item,
      amount: item.amountHandle ? toTokenAmount(getDecryptedValue(decryptedSalaryByHandle, item.amountHandle), decimals) : null,
    }))
    return payrollHistoryLimit === null ? rows : rows.slice(0, payrollHistoryLimit)
  }, [companyPayrollHistory, decryptedSalaryByHandle, payrollHistoryLimit, selectedSettlementAsset?.decimals])
  const employeeTotalReceived = useMemo(() => {
    const total = employeePayrollHistory.reduce((sum, item) => {
      if (!item.amountHandle) {
        return sum
      }

      return sum + toBigIntAmount(getDecryptedValue(decryptedSalaryByHandle, item.amountHandle))
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
  const payrollSchedule = useMemo(() => {
    return getPayrollSchedule(
      selectedCompany?.payrollDayOfMonth ?? 0,
      lastPayrollTime,
      selectedCompany?.createdAt ?? 0,
    )
  }, [lastPayrollTime, selectedCompany?.createdAt, selectedCompany?.payrollDayOfMonth])
  const employeeStartDate = useMemo(() => {
    const result = overviewResults?.[3]
    return result?.status === 'success' ? Number(result.result) : 0
  }, [overviewResults])

  return {
    canDecryptSalary: salaryDecrypt.canDecrypt,
    companyPayrollHistory: displayedCompanyPayrollHistory,
    companyPayrollHistoryError,
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
    isLoading: isLoadingEmployees || isLoadingOverview || isLoadingSalaryHandles || isLoadingBalanceHandle || isLoadingEmployeePayrollHistory || isLoadingCompanyPayrollHistory,
    isLoadingCompanyPayrollHistory,
    isLoadingEmployeePayrollHistory,
    lastPayrollTime,
    missingSalaryCount,
    payrollSchedule,
    refetchBalanceHandle,
    refetchCompanyPayrollHistory,
    refetchEmployeePayrollHistory,
    refetchOverview: refetchOverviewData,
    selectedSettlementAsset,
    salaryDecryptError: salaryDecrypt.error,
    totalMonthlyPayroll,
    treasuryVault,
    treasuryVaultConfigured,
  } as const
}
