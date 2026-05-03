'use client'

import type { PayrollOverviewData } from './types'
import { useMemo } from 'react'
import {
  MdLock as LockIcon,
  MdLockOpen as LockOpenIcon,
  MdPolicy as PolicyIcon,
} from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatAddress } from '@/utils'
import { PayrollExecutionHistory } from './payroll-execution-history'
import { formatTokenAmount, getBalanceShare } from './payroll-formatters'

interface PayrollEmployeeViewProps {
  overview: PayrollOverviewData
}

export function PayrollEmployeeView({ overview }: PayrollEmployeeViewProps) {
  const salarySymbol = overview.selectedSettlementAsset?.symbol ?? 'USDC'
  const balanceShare = getBalanceShare(overview.employeeConfidentialBalance, overview.employeeTotalReceived)
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
                <div className="mt-4 mb-8 flex items-end gap-3">
                  {formatTokenAmount(overview.employeeConfidentialBalance)}
                  <span className="mb-2 font-mono text-lg text-on-surface-variant">{salarySymbol}</span>
                </div>
              </div>

              <div className="relative z-10 mt-auto flex flex-col gap-4 sm:flex-row">
                <Button className="h-12 rounded bg-primary px-8 text-xs font-bold uppercase tracking-wide text-on-primary shadow-none hover:bg-primary-fixed hover:shadow-[0_0_20px_rgba(192,193,255,0.3)]">
                  <LockOpenIcon className="size-5" />
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
                  <span className="font-mono text-4xl font-bold text-on-surface">
                    {overview.employeeTotalReceived
                      ? (
                          <span className="font-mono text-5xl font-bold tracking-tight text-primary md:text-6xl">
                            {formatTokenAmount(overview.employeeTotalReceived)}
                          </span>
                        )
                      : (
                          <span className="flex items-center">
                            {[0.8, 0.6, 0.4, 0.2, 0.1].map(opacity => (
                              <span
                                key={opacity}
                                className="mx-1 inline-block h-4 w-4 rounded-full bg-primary shadow-[0_0_15px_rgba(192,193,255,0.3)] md:h-5 md:w-5"
                                style={{ opacity }}
                              />
                            ))}
                          </span>
                        )}
                  </span>
                  <span className="font-mono text-sm text-on-surface-variant">{salarySymbol}</span>
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
        historyRows={historyRows}
        isLoading={overview.isLoadingEmployeePayrollHistory}
        salarySymbol={salarySymbol}
      />
    </div>
  )
}
