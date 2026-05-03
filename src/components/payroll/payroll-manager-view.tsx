'use client'

import type { PayrollOverviewData } from './types'
import type { CompanySummary } from '@/contexts'
import { useMemo, useState } from 'react'
import {
  MdAutorenew as AutorenewIcon,
  MdCalendarMonth as CalendarMonthIcon,
  MdRocketLaunch as RocketLaunchIcon,
  MdSave as SaveIcon,
  MdSchedule as ScheduleIcon,
  MdToken as TokenIcon,
} from 'react-icons/md'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RolesEnum } from '@/enums'
import { usePayrollActions } from '@/hooks'
import { ExecutePayrollDialog } from '../dialogs/execute-payroll-dialog'
import { PayrollExecutionHistory } from './payroll-execution-history'

const payrollConfigSchema = z.object({
  payrollDayOfMonth: z.coerce.number().int().min(1, 'Payroll day must be between 1 and 31.').max(31, 'Payroll day must be between 1 and 31.'),
})

interface PayrollConfigDraft {
  companyId: string | null
  error: string | null
  value: string
}

interface PayrollManagerViewProps {
  overview: PayrollOverviewData
  selectedCompany: CompanySummary
}

export function PayrollManagerView({ overview, selectedCompany }: PayrollManagerViewProps) {
  const payrollActions = usePayrollActions(selectedCompany)
  const canUpdatePayrollConfig = selectedCompany.role === RolesEnum.Owner
  const salarySymbol = overview.selectedSettlementAsset?.symbol ?? 'USDC'
  const selectedCompanyId = selectedCompany.id
  const selectedPayrollDayOfMonth = String(selectedCompany.payrollDayOfMonth ?? 15)
  const [payrollConfigDraft, setPayrollConfigDraft] = useState<PayrollConfigDraft>({
    companyId: selectedCompanyId,
    error: null,
    value: selectedPayrollDayOfMonth,
  })
  const isPayrollConfigDraftCurrent = payrollConfigDraft.companyId === selectedCompanyId
  const payrollDayOfMonth = isPayrollConfigDraftCurrent ? payrollConfigDraft.value : selectedPayrollDayOfMonth
  const payrollConfigError = isPayrollConfigDraftCurrent ? payrollConfigDraft.error : null
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const isEarlyPayroll = (overview.payrollSchedule?.daysLeft ?? 0) > 1
  const historyRows = useMemo(() => {
    return overview.companyPayrollHistory.map(row => ({
      amount: null,
      amountHandle: row.amountHandle,
      executedAt: row.executedAt,
      recipient: row.recipient,
      recipientName: row.recipientName ?? 'Unknown employee',
      transactionHash: row.transactionHash,
    }))
  }, [overview.companyPayrollHistory])

  const refreshPayrollData = async () => {
    await Promise.all([
      overview.refetchOverview(),
      overview.refetchCompanyPayrollHistory(),
      overview.refetchEmployeePayrollHistory(),
    ])
  }

  const handleSavePayrollConfig = async () => {
    const result = payrollConfigSchema.safeParse({ payrollDayOfMonth })
    if (!result.success) {
      setPayrollConfigDraft({
        companyId: selectedCompanyId,
        error: result.error.issues[0]?.message ?? 'Invalid payroll day.',
        value: payrollDayOfMonth,
      })
      return
    }

    setPayrollConfigDraft({
      companyId: selectedCompanyId,
      error: null,
      value: payrollDayOfMonth,
    })
    const updated = await payrollActions.updatePayrollDay(result.data.payrollDayOfMonth)
    if (updated) {
      await refreshPayrollData()
    }
  }

  const handleConfirmExecutePayroll = async () => {
    const executed = await payrollActions.executePayrollNow()
    if (!executed) {
      return
    }

    setIsExecuteDialogOpen(false)
    await refreshPayrollData()
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Payroll Configuration</h2>
          </div>
          <Card className="rounded border border-outline-variant/5 bg-surface-container-low p-0 shadow-lg">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded border border-outline-variant/10 bg-surface-container-lowest p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ScheduleIcon className="size-5 text-primary" />
                      <h3 className="font-heading font-semibold text-on-surface">Schedule Settings</h3>
                    </div>

                    <div className="flex items-center">
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Disbursement Asset:
                      </label>
                      {/* h-12 rounded bg-surface-container px-4 */}
                      <div className="flex items-center gap-3 ml-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20">
                          <TokenIcon className="size-3 text-indigo-400" />
                        </div>
                        <span className="font-mono text-sm font-medium tracking-tight text-on-surface">
                          {salarySymbol}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Monthly Payroll Day
                      </label>
                      <Input
                        aria-invalid={Boolean(payrollConfigError)}
                        className="h-12 rounded border-outline-variant/20 bg-surface-container px-4 font-mono text-sm font-medium text-on-surface shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                        disabled={!canUpdatePayrollConfig || payrollActions.isUpdatingPayrollConfig}
                        max={31}
                        min={1}
                        type="number"
                        value={payrollDayOfMonth}
                        onChange={event =>
                          setPayrollConfigDraft({
                            companyId: selectedCompanyId,
                            error: null,
                            value: event.target.value,
                          })}
                      />
                      {payrollConfigError && (
                        <p className="text-xs font-bold text-destructive">{payrollConfigError}</p>
                      )}
                    </div>
                  </div>

                  {canUpdatePayrollConfig && (
                    <div className="mt-6">
                      <Button
                        className="h-12 w-full rounded border-none bg-surface-container-high text-sm font-semibold text-on-surface shadow-none hover:bg-surface-bright"
                        disabled={payrollActions.isUpdatingPayrollConfig}
                        variant="outline"
                        onClick={() => {
                          void handleSavePayrollConfig()
                        }}
                      >
                        {payrollActions.isUpdatingPayrollConfig ? <AutorenewIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                        Save Settings
                      </Button>
                    </div>
                  )}
                </div>

                <div className="relative flex flex-col justify-between overflow-hidden rounded border border-primary/20 bg-primary-container/5 p-6">
                  <div className="pointer-events-none absolute -right-4 -top-4 opacity-5">
                    <RocketLaunchIcon className="size-24 text-on-surface" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CalendarMonthIcon className="size-5 text-tertiary" />
                      <h3 className="font-heading font-semibold text-on-surface">Next Payroll Execution</h3>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Next Payday</p>
                      <p className="font-heading text-2xl font-black text-white">
                        {overview.payrollSchedule?.nextPayrollDate ?? '-'}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                        {overview.payrollSchedule ? `${overview.payrollSchedule.daysLeft} days left` : 'Not configured'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Button
                      className="primary-gradient h-12 w-full rounded border-none text-sm font-black tracking-wide text-on-primary-container shadow-none hover:shadow-[0_0_20px_rgba(192,193,255,0.3)]"
                      disabled={payrollActions.isExecutingPayroll || !overview.treasuryVaultConfigured}
                      onClick={() => setIsExecuteDialogOpen(true)}
                    >
                      {payrollActions.isExecutingPayroll ? <AutorenewIcon className="size-4 animate-spin" /> : <RocketLaunchIcon className="size-4" />}
                      Run Payroll Now
                    </Button>
                    {!overview.treasuryVaultConfigured && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">Treasury vault missing</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <PayrollExecutionHistory
          error={overview.companyPayrollHistoryError}
          historyRows={historyRows}
          indexedTransferCount={overview.companyPayrollHistory.length}
          isLoading={overview.isLoadingCompanyPayrollHistory}
          salarySymbol={salarySymbol}
          showTreasuryVaultFooter
          treasuryVault={overview.treasuryVault}
          treasuryVaultConfigured={overview.treasuryVaultConfigured}
        />
      </div>

      <ExecutePayrollDialog
        isEarlyPayroll={isEarlyPayroll}
        isExecuting={payrollActions.isExecutingPayroll}
        nextPayrollDate={overview.payrollSchedule?.nextPayrollDate}
        open={isExecuteDialogOpen}
        onConfirm={() => {
          void handleConfirmExecutePayroll()
        }}
        onOpenChange={setIsExecuteDialogOpen}
      />
    </>
  )
}
