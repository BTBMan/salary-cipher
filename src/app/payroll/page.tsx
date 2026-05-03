'use client'

import { useMemo, useState } from 'react'
import {
  MdAutorenew as AutorenewIcon,
  MdCalendarMonth as CalendarMonthIcon,
  MdCurrencyExchange as CurrencyExchangeIcon,
  MdEventRepeat as EventRepeatIcon,
  MdFilterList as FilterListIcon,
  MdLock as LockIcon,
  MdOpenInNew as OpenInNewIcon,
  MdSave as SaveIcon,
  MdShield as ShieldPersonIcon,
  MdToken as TokenIcon,
} from 'react-icons/md'
import { useChainId } from 'wagmi'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export default function PayrollHistoryPage() {
  const { selectedCompany } = useStoreContext()
  const chainId = useChainId()
  const overview = useOverviewChainData(selectedCompany, { payrollHistoryLimit: null })
  const payrollActions = usePayrollActions(selectedCompany)
  const canExecutePayroll = canManagePayroll(selectedCompany?.role)
  const canUpdatePayrollConfig = selectedCompany?.role === RolesEnum.Owner
  const salarySymbol = overview.selectedSettlementAsset?.symbol ?? 'USDC'
  const networkLabel = chainId === 31337 ? 'Hardhat' : chainId === 11155111 ? 'Sepolia' : `Chain ${chainId}`
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
              <div className="w-1 h-6 bg-primary rounded-full shadow-[0_0_8px_#c0c1ff]" />
              <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Payroll Configuration</h2>
            </div>
            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                      <EventRepeatIcon className="text-tertiary size-4" />
                      Monthly Payroll Day
                    </label>
                    <Input
                      aria-invalid={Boolean(payrollConfigError)}
                      className="h-12 rounded-lg border-none bg-surface-container-lowest font-mono font-bold shadow-inner"
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
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                      <CurrencyExchangeIcon className="text-tertiary size-4" />
                      Payroll Token
                    </label>
                    <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-white/5 shadow-inner">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <TokenIcon className="size-3 text-indigo-400" />
                      </div>
                      <span className="font-mono text-xs font-black tracking-widest text-on-surface">{salarySymbol}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                      <ShieldPersonIcon className="text-tertiary size-4" />
                      Network
                    </label>
                    <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-white/5 shadow-inner">
                      <span className="font-mono text-xs font-black tracking-widest text-on-surface">{networkLabel}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                      <CalendarMonthIcon className="text-tertiary size-4" />
                      Next Payday
                    </label>
                    <div className="flex flex-col gap-1 bg-surface-container-lowest p-3 rounded-lg border border-white/5 shadow-inner">
                      <span className="font-mono text-xs font-black tracking-widest text-on-surface">{overview.payrollSchedule?.nextPayrollDate ?? '-'}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-outline">{overview.payrollSchedule ? `${overview.payrollSchedule.daysLeft} days left` : 'Not configured'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {canUpdatePayrollConfig && (
                      <Button
                        className="primary-gradient text-on-primary-container text-sm h-12 px-6 rounded-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all border-none flex items-center gap-2"
                        disabled={payrollActions.isUpdatingPayrollConfig}
                        onClick={() => {
                          void handleSavePayrollConfig()
                        }}
                      >
                        {payrollActions.isUpdatingPayrollConfig ? <AutorenewIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                        Save Settings
                      </Button>
                    )}
                    <Button
                      className="h-12 rounded-sm border-primary/20 bg-primary/10 px-6 text-sm font-black uppercase tracking-widest text-primary hover:bg-primary/15"
                      disabled={payrollActions.isExecutingPayroll || !overview.treasuryVaultConfigured}
                      variant="outline"
                      onClick={() => setIsExecuteDialogOpen(true)}
                    >
                      Execute Now
                    </Button>
                    {!overview.treasuryVaultConfigured && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">Treasury vault missing</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <div className="flex items-center gap-3 flex-wrap">
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
            </div>
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
