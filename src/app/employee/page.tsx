'use client'

import Link from 'next/link'
import {
  MdAccountBalance as AccountBalanceIcon,
  MdAdd as AddIcon,
  MdAutorenew as AutorenewIcon,
  MdDescription as DescriptionIcon,
  MdDirectionsCar as DirectionsCarIcon,
  MdHome as HomeIcon,
  MdLock as LockIcon,
  MdAccountBalanceWallet,
  MdArrowForward,
  MdSchedule as ScheduleIcon,
  MdVerifiedUser as VerifiedUserIcon,
  MdVisibility as VisibilityIcon,
} from 'react-icons/md'
import { EncryptedField } from '@/components/encrypted-field'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOverviewChainData, useStoreContext } from '@/hooks'
import { cn, formatAddress, formatUnixDate, getConfidentialTokenSymbol } from '@/utils'

function formatTokenAmount(value: string | null, fallback = '••••••••') {
  if (!value) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value))
}

export default function EmployeeDashboardPage() {
  const { selectedCompany } = useStoreContext()
  const overview = useOverviewChainData(selectedCompany)
  const confidentialTokenSymbol = getConfidentialTokenSymbol(overview.selectedSettlementAsset)
  const daysLeft = overview.payrollSchedule?.daysLeft ?? 0
  const periodProgress = overview.payrollSchedule?.periodProgress ?? 0

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <section className="flex flex-col gap-1 px-1">
          <h1 className="text-3xl font-heading font-black text-on-surface tracking-tight">Sovereign Overview</h1>
          <p className="text-on-surface-variant text-sm font-medium">Welcome back. Your payroll data is encrypted with FHE technology.</p>
        </section>

        {/* Stats Cards Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Monthly Salary */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-primary group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Monthly Salary</span>
              <LockIcon className="text-primary size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <EncryptedField
                canDecrypt={overview.canDecryptSalary}
                className="space-y-0"
                isDecrypting={overview.isDecryptingSalary}
                isEncrypted={!overview.employeeMonthlySalary}
                value={formatTokenAmount(overview.employeeMonthlySalary)}
                valueClassName="font-mono text-2xl font-black text-white"
                onDecrypt={overview.decryptSalary}
              />
              <span className="font-mono text-[10px] font-black text-outline tracking-tighter">{confidentialTokenSymbol}</span>
            </div>
            <p className="mt-3 text-[9px] text-slate-500 font-black uppercase tracking-widest">
              {overview.employeeMonthlySalary ? 'DECRYPTED LOCALLY' : 'FHE ENCRYPTED'}
            </p>
          </div>

          {/* Earned This Period */}
          {/* <div className="bg-surface-container p-5 rounded-lg border-l-2 border-tertiary group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Earned This Period</span>
              <EncryptedIcon className="text-tertiary size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-on-surface-variant">N/A</span>
              <span className="font-mono text-[10px] font-black text-outline uppercase tracking-tighter">{salarySymbol}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-surface-container-low rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-tertiary rounded-full" style={{ width: `${periodProgress}%` }} />
              </div>
              <span className="text-[9px] font-black font-mono text-tertiary">{periodProgress}%</span>
            </div>
          </div> */}

          {/* Balance */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-tertiary group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Balance</span>
              <MdAccountBalanceWallet className="text-tertiary size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <EncryptedField
                canDecrypt={overview.canDecryptSalary}
                className="space-y-0"
                isDecrypting={overview.isDecryptingSalary}
                isEncrypted={!overview.employeeConfidentialBalance}
                value={formatTokenAmount(overview.employeeConfidentialBalance)}
                valueClassName="font-mono text-2xl font-black text-white"
                onDecrypt={overview.decryptSalary}
              />
              <span className="font-mono text-[10px] font-black text-outline tracking-tighter">{confidentialTokenSymbol}</span>
            </div>
            <p className="mt-3 text-[9px] text-slate-500 font-black uppercase tracking-widest">
              {overview.employeeBalanceHandle ? 'CONFIDENTIAL TOKEN BALANCE' : 'BALANCE HANDLE NOT FOUND'}
            </p>
          </div>

          {/* Total Received */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-[#d0bcff] group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Total Received</span>
              <AccountBalanceIcon className="text-[#d0bcff] size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <EncryptedField
                canDecrypt={overview.canDecryptSalary}
                className="space-y-0"
                isDecrypting={overview.isDecryptingSalary}
                isEncrypted={!overview.employeeTotalReceived}
                value={formatTokenAmount(overview.employeeTotalReceived)}
                valueClassName="font-mono text-2xl font-black text-white"
                onDecrypt={overview.decryptSalary}
              />
              <span className="font-mono text-[10px] font-black text-outline tracking-tighter">{confidentialTokenSymbol}</span>
            </div>
            <p className="mt-3 text-[9px] text-slate-500 font-black uppercase tracking-widest">FROM PAYROLL EVENTS</p>
          </div>

          {/* Next Payday */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-primary-container group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Next Payday</span>
              <ScheduleIcon className="text-primary-container size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-heading font-black text-on-surface tracking-tighter">{daysLeft}</span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Days Left</span>
            </div>
            <div className="h-1 mt-3.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="h-full bg-primary-container rounded-full shadow-[0_0_4px_#8083ff]" style={{ width: `${periodProgress}%` }} />
            </div>
            <p className="mt-3 text-[9px] text-slate-500 font-black uppercase tracking-widest">{overview.payrollSchedule?.nextPayrollDate ?? 'Payroll day not set'}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Payout Wallet</p>
              <p className="mt-3 font-mono text-sm font-bold text-on-surface">
                {overview.currentEmployee ? formatAddress(overview.currentEmployee.payoutWallet) : '-'}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Start Date</p>
              <p className="mt-3 font-mono text-sm font-bold text-on-surface">
                {overview.employeeStartDate ? formatUnixDate(overview.employeeStartDate) : '-'}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Salary Handle</p>
              <p className="mt-3 font-mono text-sm font-bold text-on-surface">
                {overview.employeeSalaryHandle ? formatAddress(overview.employeeSalaryHandle) : 'Not set'}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Content Grid: 6:4 Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

          {/* Left: Salary History (60%) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading text-xl font-bold text-on-surface tracking-tight">My Salary History</h3>
              {/* <Button variant="link" size="sm" className="px-0 text-[10px] font-black uppercase tracking-widest">Download CSV</Button> */}
              <Button
                variant="link"
                className="text-primary text-xs font-bold uppercase tracking-widest hover:no-underline group p-0"
                render={(
                  <Link href="/payroll">
                    View Full Ledger <MdArrowForward className="size-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              />
            </div>
            <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container-low py-0 shadow-2xl">
              <CardContent className="px-0">
                <Table className="text-left">
                  <TableHeader className="bg-surface-container">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Execution Time</TableHead>
                      <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Encrypted Amount</TableHead>
                      <TableHead className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.isLoadingEmployeePayrollHistory
                      ? (
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={3}>
                              <div className="flex items-center justify-center gap-2">
                                <AutorenewIcon className="size-4 animate-spin" />
                                Loading payroll events
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      : overview.employeePayrollHistory.length === 0
                        ? (
                            <TableRow className="border-white/5 hover:bg-transparent">
                              <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={3}>
                                No payroll history events found.
                              </TableCell>
                            </TableRow>
                          )
                        : overview.employeePayrollHistory.map(row => (
                            <TableRow key={`${row.transactionHash}-${row.executedAt}`} className="group border-white/5 hover:bg-surface-container">
                              <TableCell className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-on-surface">{formatUnixDate(row.executedAt)}</span>
                                  <span className="text-[10px] text-outline font-mono mt-1 font-bold uppercase tracking-widest">Tx: {formatAddress(row.transactionHash)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                  <EncryptedField
                                    canDecrypt={overview.canDecryptSalary}
                                    className="space-y-0"
                                    isDecrypting={overview.isDecryptingSalary}
                                    isEncrypted={!row.amount}
                                    value={formatTokenAmount(row.amount)}
                                    valueClassName="font-mono text-sm text-on-surface-variant font-bold"
                                    onDecrypt={overview.decryptSalary}
                                  />
                                  <span className="text-[10px] font-black text-outline tracking-tighter">{confidentialTokenSymbol}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-5 text-right">
                                <span className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-sm border border-primary/20 uppercase tracking-widest">
                                  {row.amount ? 'Decrypted' : 'Encrypted'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                  </TableBody>
                </Table>
                {overview.employeePayrollHistoryError && (
                  <div className="px-6 py-3 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                    {overview.employeePayrollHistoryError}
                  </div>
                )}
                <div className="px-6 py-4 bg-surface-container-lowest/20 text-center border-t border-white/5">
                  <Button
                    variant="ghost"
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-on-surface"
                    disabled={overview.isLoadingEmployeePayrollHistory}
                    onClick={() => {
                      void overview.refetchEmployeePayrollHistory()
                    }}
                  >
                    Refresh History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Income Proofs (40%) */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80 px-1">Proof Center</h3>

            {/* Proof CTA Card */}
            <Card className="group relative overflow-hidden rounded-xl border border-white/5 bg-surface-container p-0 shadow-2xl">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-linear-to-br from-tertiary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-surface-container-highest rounded-xl flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                    <VerifiedUserIcon className="text-tertiary size-8 fill-current" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-on-surface tracking-tight mb-2">RWA Income Proofs</h3>
                  <p className="text-on-surface-variant text-xs font-medium leading-relaxed mb-8 opacity-80">
                    Proof generation is not connected yet. Current contract only exposes salary condition verification for a future proof contract.
                  </p>
                  <Button disabled className="primary-gradient text-on-primary-container text-sm h-10 px-6 rounded-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2 border-none">
                    <AddIcon className="size-4" />
                    Proof Contract Missing
                  </Button>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 pointer-events-none transform rotate-12 group-hover:scale-110 transition-all duration-700">
                  <VerifiedUserIcon className="size-48 fill-current" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Proofs List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">Active Proof Sessions</h4>
              <div className="space-y-2.5">
                {[
                  { icon: HomeIcon, title: 'Mortgage Eligibility', sub: 'Needs SalaryProof workflow', color: 'text-primary' },
                  { icon: DirectionsCarIcon, title: 'Auto Loan Check', sub: 'No proof session storage', color: 'text-tertiary' },
                  { icon: DescriptionIcon, title: 'Generic Income Level', sub: 'No request history getter', color: 'text-emerald-400' },
                ].map(p => (
                  <Card key={p.title} className="rounded-xl border border-transparent bg-surface-container-low p-0 shadow-lg transition-all hover:border-white/5 hover:bg-surface-container-high">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 transition-colors">
                          <p.icon className={cn('size-5', p.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface leading-none">{p.title}</p>
                          <p className="text-[10px] text-outline font-bold mt-1.5 uppercase tracking-widest">{p.sub}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="text-outline hover:text-primary">
                        <VisibilityIcon className="size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
