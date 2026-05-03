'use client'

import { useMemo, useState } from 'react'
import {
  MdAutorenew as AutorenewIcon,
  MdCalendarMonth as CalendarMonthIcon,
  // MdFilterList as FilterListIcon,
  MdLock as LockIcon,
  MdLockOpen as LockOpenIcon,
  MdOpenInNew as OpenInNewIcon,
  MdPolicy as PolicyIcon,
  MdRocketLaunch as RocketLaunchIcon,
  MdSave as SaveIcon,
  MdSchedule as ScheduleIcon,
  MdShield as ShieldPersonIcon,
  MdToken as TokenIcon,
} from 'react-icons/md'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/app-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { canManagePayroll } from '@/constants'
import { RolesEnum } from '@/enums'
import { useOverviewChainData, usePayrollActions, useStoreContext } from '@/hooks'
import { formatAddress, formatUnixDate, getAvatarFallback } from '@/utils'

const payrollConfigSchema = z.object({
  payrollDayOfMonth: z.coerce.number().int().min(1, 'Payroll day must be between 1 and 31.').max(31, 'Payroll day must be between 1 and 31.'),
})

interface PayrollConfigDraft {
  companyId: string | null
  error: string | null
  value: string
}

function formatTokenAmount(value: string | null, fallback = '••••••••') {
  if (!value) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value))
}

function getBalanceShare(balance: string | null, total: string | null) {
  const balanceValue = Number(balance)
  const totalValue = Number(total)

  if (!Number.isFinite(balanceValue) || !Number.isFinite(totalValue) || totalValue <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((balanceValue / totalValue) * 100)))
}

export default function PayrollHistoryPage() {
  const { selectedCompany } = useStoreContext()
  const overview = useOverviewChainData(selectedCompany, { payrollHistoryLimit: null })
  const payrollActions = usePayrollActions(selectedCompany)
  const canExecutePayroll = canManagePayroll(selectedCompany?.role)
  const canUpdatePayrollConfig = selectedCompany?.role === RolesEnum.Owner
  const canViewPersonalEarnings = selectedCompany?.role === RolesEnum.Employee
  const salarySymbol = overview.selectedSettlementAsset?.symbol ?? 'USDC'
  const balanceShare = getBalanceShare(overview.employeeConfidentialBalance, overview.employeeTotalReceived)
  const selectedCompanyId = selectedCompany?.id ?? null
  const selectedPayrollDayOfMonth = String(selectedCompany?.payrollDayOfMonth ?? 15)
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
    if (selectedCompany?.role === RolesEnum.Employee) {
      return overview.employeePayrollHistory.map(row => ({
        amount: row.amount,
        amountHandle: row.amountHandle,
        executedAt: row.executedAt,
        recipient: overview.currentEmployee?.payoutWallet,
        recipientName: overview.currentEmployee?.displayName ?? 'Me',
        transactionHash: row.transactionHash,
      }))
    }

    return overview.companyPayrollHistory.map(row => ({
      amount: null,
      amountHandle: row.amountHandle,
      executedAt: row.executedAt,
      recipient: row.recipient,
      recipientName: row.recipientName ?? 'Unknown employee',
      transactionHash: row.transactionHash,
    }))
  }, [overview.companyPayrollHistory, overview.currentEmployee?.displayName, overview.currentEmployee?.payoutWallet, overview.employeePayrollHistory, selectedCompany?.role])
  const isLoadingHistory = selectedCompany?.role === RolesEnum.Employee
    ? overview.isLoadingEmployeePayrollHistory
    : overview.isLoadingCompanyPayrollHistory
  const historyError = selectedCompany?.role === RolesEnum.Employee
    ? overview.employeePayrollHistoryError
    : overview.companyPayrollHistoryError

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
    <AppLayout>
      <div className="flex flex-col gap-10">

        {/* Payroll Configuration Section */}
        {canExecutePayroll && (
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
        )}

        {canViewPersonalEarnings && (
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
        )}

        {/* Execution History Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-tertiary rounded-full shadow-[0_0_8px_#ddb7ff]" />
              <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Execution History</h2>
            </div>

            {/* Filters */}
            {/* <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <CalendarMonthIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-4" />
                <Select defaultValue="30d">
                  <SelectTrigger className="h-9 rounded-lg border-none bg-surface-container pl-9 pr-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant shadow-lg focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="q3">Q3 2024</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <FilterListIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-4" />
                <Select defaultValue="all">
                  <SelectTrigger className="h-9 rounded-lg border-none bg-surface-container pl-9 pr-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant shadow-lg focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div> */}
          </div>

          <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container py-0 shadow-2xl">
            <CardContent className="px-0">
              <Table className="text-left">
                <TableHeader className="bg-surface-container-high/50">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Execution Date</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Employee Entity</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Amount (FHE)</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Status</TableHead>
                    <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingHistory
                    ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                            <div className="flex items-center justify-center gap-2">
                              <AutorenewIcon className="size-4 animate-spin" />
                              Loading payroll events
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    : historyRows.length === 0
                      ? (
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                              No payroll execution history found.
                            </TableCell>
                          </TableRow>
                        )
                      : historyRows.map(row => (
                          <TableRow key={`${row.transactionHash}-${row.recipient ?? 'self'}-${row.executedAt}`} className="group cursor-pointer border-white/5 hover:bg-surface-bright/10">
                            <TableCell className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-mono text-sm font-bold text-on-surface">{formatUnixDate(row.executedAt)}</span>
                                <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-outline">Tx: {formatAddress(row.transactionHash)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 rounded-full border border-white/10">
                                  <AvatarFallback className="bg-surface-variant text-[8px] font-black">
                                    {getAvatarFallback(row.recipientName, row.recipient ?? 'SC')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-on-surface leading-tight">{row.recipientName}</span>
                                  <span className="font-mono text-[10px] text-outline font-bold tracking-tighter">
                                    {row.recipient ? formatAddress(row.recipient) : '-'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="inline-flex items-center gap-2 bg-surface-container-lowest border border-tertiary/10 px-3 py-1.5 rounded-lg group-hover:border-tertiary/40 transition-all relative overflow-hidden">
                                <span className="font-mono text-sm text-tertiary font-bold">
                                  {row.amount ?? (row.amountHandle ? formatAddress(row.amountHandle) : 'Handle missing')}
                                  <span className="text-[10px] text-outline font-black"> {salarySymbol}</span>
                                </span>
                                {!row.amount && <LockIcon className="size-3 text-tertiary fill-current" />}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Paid
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <Button disabled variant="link" size="sm" className="ml-auto h-auto px-0 text-[10px] font-black text-outline uppercase tracking-widest">
                                Indexed Event
                                <OpenInNewIcon className="size-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                </TableBody>
              </Table>

              {historyError && (
                <div className="px-6 py-3 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                  {historyError}
                </div>
              )}

              {canExecutePayroll && (
                <div className="bg-surface-container-highest px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-white/10 shadow-inner">
                      <ShieldPersonIcon className="text-primary size-7 fill-current" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant mb-1.5 opacity-60">Treasury Vault</p>
                      <p className="font-mono text-lg font-black text-on-surface tracking-tighter">
                        {overview.treasuryVaultConfigured ? formatAddress(overview.treasuryVault) : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest/40 border border-white/5 px-8 py-4 rounded-xl flex flex-col items-center md:items-end shadow-2xl max-w-xs w-full">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-tertiary mb-1.5 opacity-80">Indexed Payroll Transfers</p>
                    <p className="font-mono text-2xl font-black text-white tracking-tighter">{overview.companyPayrollHistory.length}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
          <DialogHeader className="border-b border-white/5 px-6 py-5">
            <DialogTitle>Execute payroll now</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              {isEarlyPayroll
                ? `The next scheduled payday is ${overview.payrollSchedule?.nextPayrollDate ?? 'not available'}, which is more than one day away. Executing now will pay the next unpaid payroll cycle early and move the next payday forward.`
                : 'This will execute the current unpaid payroll cycle for all eligible employees.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-lg border border-white/5 bg-surface-container-lowest p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Current next payday</p>
              <p className="mt-2 font-mono text-lg font-black text-on-surface">{overview.payrollSchedule?.nextPayrollDate ?? '-'}</p>
            </div>
            <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
              Payroll transfers are confidential token transfers. The amount remains encrypted, but recipient addresses and execution events are visible on-chain.
            </p>
          </div>
          <DialogFooter className="border-t border-white/5 px-6 py-5">
            <Button
              disabled={payrollActions.isExecutingPayroll}
              variant="outline"
              onClick={() => setIsExecuteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="primary-gradient border-none text-on-primary-container"
              disabled={payrollActions.isExecutingPayroll}
              onClick={() => {
                void handleConfirmExecutePayroll()
              }}
            >
              {payrollActions.isExecutingPayroll && <AutorenewIcon className="size-4 animate-spin" />}
              Confirm Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
