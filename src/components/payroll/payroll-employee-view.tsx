'use client'

import type { PayrollOverviewData } from './types'
import type { CompanySummary } from '@/contexts'
import { useMemo } from 'react'
import {
  MdAutorenew as AutorenewIcon,
  MdLock as LockIcon,
  MdLockOpen as LockOpenIcon,
  MdPolicy as PolicyIcon,
} from 'react-icons/md'
import { EncryptedField } from '@/components/encrypted-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEmployeePayrollWithdraw } from '@/hooks'
import { formatAddress, getConfidentialTokenSymbol, getUnderlyingTokenSymbol } from '@/utils'
import { PayrollExecutionHistory } from './payroll-execution-history'
import { formatTokenAmount, getBalanceShare } from './payroll-formatters'

interface PayrollEmployeeViewProps {
  overview: PayrollOverviewData
  selectedCompany: CompanySummary
}

export function PayrollEmployeeView({ overview, selectedCompany }: PayrollEmployeeViewProps) {
  const salarySymbol = getConfidentialTokenSymbol(overview.selectedSettlementAsset)
  const underlyingTokenSymbol = getUnderlyingTokenSymbol(overview.selectedSettlementAsset)
  const balanceShare = getBalanceShare(overview.employeeConfidentialBalance, overview.employeeTotalReceived)
  const employeeWithdraw = useEmployeePayrollWithdraw({
    encryptedBalanceHandle: overview.employeeBalanceHandle,
    onWithdrawn: overview.refetchBalanceHandle,
    payoutWallet: overview.currentEmployee?.payoutWallet,
    selectedCompany,
    selectedSettlementAsset: overview.selectedSettlementAsset,
  })
  const historyRows = useMemo(() => {
    return overview.employeePayrollHistory.map(row => ({
      amount: row.amount,
      amountHandle: row.amountHandle,
      executedAt: row.executedAt,
      recipient: overview.currentEmployee?.payoutWallet,
      recipientName: overview.currentEmployee?.displayName ?? 'Me',
      transactionHash: row.transactionHash,
    }))
  }, [overview.currentEmployee?.displayName, overview.currentEmployee?.payoutWallet, overview.employeePayrollHistory])

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Personal Earnings</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="relative min-h-75 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-0 shadow-lg lg:col-span-2">
            <CardContent className="flex min-h-75 flex-col justify-between p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <LockIcon className="size-4 text-primary fill-current" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Available Balance (Encrypted)</h3>
                </div>
                <div className="mt-4 mb-8 flex items-baseline gap-3">
                  <EncryptedField
                    canDecrypt={overview.canDecryptSalary}
                    className="space-y-0"
                    isDecrypting={overview.employeeBalanceHandle && overview.selectedSettlementAsset?.settlementToken ? overview.isDecryptingSalaryHandle(overview.employeeBalanceHandle, overview.selectedSettlementAsset.settlementToken) : overview.isDecryptingSalary}
                    isEncrypted={!overview.employeeConfidentialBalance}
                    value={formatTokenAmount(overview.employeeConfidentialBalance)}
                    valueClassName="font-mono text-5xl font-bold tracking-tight text-primary md:text-6xl"
                    onDecrypt={() => {
                      if (overview.employeeBalanceHandle && overview.selectedSettlementAsset?.settlementToken) {
                        overview.decryptSalaryHandle(overview.employeeBalanceHandle, overview.selectedSettlementAsset.settlementToken)
                      }
                      else {
                        overview.decryptSalary()
                      }
                    }}
                  />
                  <span className="font-mono text-lg font-bold text-on-surface-variant">{salarySymbol}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] font-black uppercase tracking-widest text-outline">
                  <span>
                    Underlying Balance:
                    {' '}
                    <span className="text-on-surface">{formatTokenAmount(employeeWithdraw.underlyingBalance)}</span>
                    {' '}
                    {underlyingTokenSymbol}
                  </span>
                  <span>Wallet: {overview.currentEmployee ? formatAddress(overview.currentEmployee.payoutWallet) : '-'}</span>
                </div>
              </div>

              <div className="relative z-10 mt-auto flex flex-col gap-4 sm:flex-row">
                <Button
                  className="h-12 rounded bg-primary px-8 text-xs font-bold uppercase tracking-wide text-on-primary shadow-none hover:bg-primary-fixed hover:shadow-[0_0_20px_rgba(192,193,255,0.3)]"
                  disabled={employeeWithdraw.isWithdrawingEncryptedSalary || !overview.employeeBalanceHandle || !employeeWithdraw.canUsePayoutWallet}
                  onClick={() => {
                    void employeeWithdraw.withdrawEncryptedSalary()
                  }}
                >
                  {employeeWithdraw.isWithdrawingEncryptedSalary
                    ? <AutorenewIcon className="size-5 animate-spin" />
                    : <LockOpenIcon className="size-5" />}
                  Unwrap &amp; Withdraw
                </Button>
                <Button className="h-12 rounded border border-outline-variant/30 bg-surface-variant/50 px-8 text-xs font-bold uppercase tracking-wide text-on-surface shadow-none hover:bg-surface-variant" variant="outline">
                  <PolicyIcon className="size-5" />
                  View Proofs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-0 shadow-lg">
            <CardContent className="relative flex h-full min-h-75 flex-col justify-between p-6">
              <div className="relative z-10">
                <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Earned</h3>
                <div className="flex items-baseline gap-2">
                  <EncryptedField
                    canDecrypt={overview.canDecryptSalary}
                    className="space-y-0"
                    isDecrypting={overview.isDecryptingSalary}
                    isEncrypted={!overview.employeeTotalReceived}
                    value={formatTokenAmount(overview.employeeTotalReceived)}
                    valueClassName="font-mono text-4xl font-bold tracking-tight text-primary md:text-5xl"
                    onDecrypt={overview.decryptSalary}
                  />
                  <span className="font-mono text-lg font-bold text-on-surface-variant">{salarySymbol}</span>
                </div>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-tighter text-outline">
                  Wallet: {overview.currentEmployee ? formatAddress(overview.currentEmployee.payoutWallet) : '-'}
                </p>
              </div>

              <div className="relative z-10 mt-8">
                <div className="mb-3 h-2 w-full rounded-full bg-surface-container-highest">
                  <div
                    className="h-2 rounded-full bg-tertiary shadow-[0_0_10px_rgba(221,183,255,0.3)]"
                    style={{ width: `${balanceShare}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-outline">
                  <span>Available</span>
                  <span>{balanceShare}% of total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PayrollExecutionHistory
        error={overview.employeePayrollHistoryError}
        canDecryptAmount={overview.canDecryptSalary}
        getIsDecryptingAmount={row => row.amountHandle && overview.selectedSettlementAsset?.settlementToken
          ? overview.isDecryptingSalaryHandle(row.amountHandle, overview.selectedSettlementAsset.settlementToken)
          : false}
        historyRows={historyRows}
        isDecryptingAmount={overview.isDecryptingSalary}
        isLoading={overview.isLoadingEmployeePayrollHistory}
        onDecryptAmount={(row) => {
          if (row.amountHandle && overview.selectedSettlementAsset?.settlementToken) {
            overview.decryptSalaryHandle(row.amountHandle, overview.selectedSettlementAsset.settlementToken)
          }
        }}
        salarySymbol={salarySymbol}
      />
    </div>
  )
}
