'use client'

import {
  MdArrowForward as ArrowForwardIcon,
  MdAutorenew as AutorenewIcon,
  MdCheckCircle as CheckCircleIcon,
  MdLock as LockIcon,
  MdPendingActions as PendingActionsIcon,
  MdVerifiedUser as VerifiedUserIcon,
  MdVisibility as VisibilityIcon,
  MdWarningAmber as WarningIcon,
} from 'react-icons/md'
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
import { canManagePayroll, canViewFinance } from '@/constants'
import { useOverviewChainData, useStoreContext } from '@/hooks'
import { formatAddress, formatUnixDate } from '@/utils'

function formatTokenAmount(value: string | null, fallback = '••••••••') {
  if (!value) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value))
}

export default function DashboardPage() {
  const { selectedCompany } = useStoreContext()
  const overview = useOverviewChainData(selectedCompany)
  const canViewCompanyPayroll = canManagePayroll(selectedCompany?.role)
  const canViewCompanyFinance = canViewFinance(selectedCompany?.role)
  const salarySymbol = overview.selectedSettlementAsset?.symbol ?? 'USDC'
  const daysLeft = overview.payrollSchedule?.daysLeft ?? 0
  const periodProgress = overview.payrollSchedule?.periodProgress ?? 0

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Stats Section: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Managing Employees */}
          <div className="bg-surface-container-low p-5 rounded-lg transition-all hover:bg-surface-container border-b-2 border-transparent hover:border-primary/20 group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-3">Managing Employees</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-black text-on-surface">{overview.employees.length}</span>
              <span className="text-primary text-xs font-bold tracking-tight">On-chain active</span>
            </div>
          </div>

          {canViewCompanyPayroll && (
            <div className="bg-[#571bc1] p-5 rounded-lg transition-all shadow-[0_20px_40px_rgba(87,27,193,0.3)] relative overflow-hidden group border-none">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

              <p className="text-[#c4abff] text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <LockIcon className="size-3 fill-current" /> Total Monthly Payroll
              </p>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className={overview.totalMonthlyPayroll ? 'text-3xl font-mono font-bold text-white' : 'text-3xl font-mono font-bold blur-[6px] select-none text-white'}>
                  {formatTokenAmount(overview.totalMonthlyPayroll)}
                </span>
                <span className="text-[#c4abff] text-xs font-black uppercase tracking-tighter">{salarySymbol}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 relative z-10">
                <div className="text-[9px] text-[#c4abff]/60 tracking-[0.2em] font-black uppercase">
                  {overview.totalMonthlyPayroll ? 'DECRYPTED LOCALLY' : 'FHE ENCRYPTED'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-[#c4abff] hover:text-white"
                  disabled={!overview.canDecryptSalary || overview.isDecryptingSalary}
                  onClick={overview.decryptSalary}
                >
                  {overview.isDecryptingSalary ? <AutorenewIcon className="size-3 mr-1 animate-spin" /> : <VisibilityIcon className="size-3 mr-1" />}
                  Decrypt
                </Button>
              </div>
            </div>
          )}

          {/* Stat 3: Fund Pool Exhaustion */}
          {canViewCompanyFinance && (
            <div className="bg-surface-container-low p-5 rounded-lg transition-all hover:bg-surface-container border-none group">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-3">Treasury Vault</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-black text-on-surface">
                  {overview.treasuryVaultConfigured ? 'Ready' : 'None'}
                </span>
                <span className={overview.treasuryVaultConfigured ? 'text-emerald-400 text-xs font-bold tracking-tight uppercase' : 'text-destructive text-xs font-bold tracking-tight uppercase'}>
                  {overview.treasuryVaultConfigured ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
          )}

          {/* Stat 4: Next Payday */}
          <div className="bg-surface-container-low p-5 rounded-lg transition-all hover:bg-surface-container border-none group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-3">Next Payday Arrival</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-heading font-black text-primary">{daysLeft}<span className="text-lg ml-0.5 opacity-60">d</span></span>
              <div className="flex-1 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full shadow-[0_0_8px_#c0c1ff]" style={{ width: `${periodProgress}%` }} />
              </div>
            </div>
            <p className="mt-3 text-[9px] text-outline font-black uppercase tracking-widest">
              {overview.payrollSchedule?.nextPayrollDate ?? 'Payroll day not set'}
            </p>
          </div>
        </div>

        {/* Main Grid: 6:4 Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">

          {/* Left Column: Payroll History (60%) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex justify-between items-end px-1">
              <div>
                <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Recent Payroll History</h2>
                <p className="text-on-surface-variant text-sm mt-1">Immutable ledger of last encrypted disbursements</p>
              </div>
              <Button variant="link" className="text-primary text-xs font-bold uppercase tracking-widest hover:no-underline group p-0">
                View Full Ledger <ArrowForwardIcon className="size-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container-low py-0 shadow-2xl">
              <CardContent className="px-0">
                <Table className="text-left border-collapse">
                  <TableHeader className="bg-surface-container/50">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Execution Time</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Batch Amount</TableHead>
                      <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={3}>
                        Payroll history needs event indexing or an on-chain history getter.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (40%) */}
          <div className="lg:col-span-4 space-y-6">

            {canViewCompanyFinance && (
              <Card className="rounded-xl border border-white/5 bg-surface-container p-0 shadow-2xl">
                <CardContent className="space-y-8 p-6">
                  <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80">Fund Pool Health</h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-[10px] text-outline font-black uppercase tracking-[0.15em]">Vault Address</span>
                        <span className="text-[9px] bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-tertiary/20">Registry</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-white/10 shadow-inner">
                          <VerifiedUserIcon className="text-tertiary size-6 fill-current" />
                        </div>
                        <div>
                          <p className="text-2xl font-mono text-on-surface leading-none font-bold">
                            {overview.treasuryVaultConfigured ? formatAddress(overview.treasuryVault) : 'Not set'}
                          </p>
                          <p className="text-[10px] text-outline mt-1.5 font-bold uppercase tracking-wider">
                            Confidential balance has no read-only dashboard getter.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-on-surface">Last Payroll</span>
                        <span className="text-primary">{overview.lastPayrollTime ? formatUnixDate(overview.lastPayrollTime) : 'Never'}</span>
                      </div>
                      <div className="h-3 bg-surface-container-lowest rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className="bg-linear-to-r from-primary to-tertiary h-full rounded-full" style={{ width: `${periodProgress}%` }} />
                      </div>
                      <p className="text-[9px] text-outline italic text-right font-medium">Next payroll: {overview.payrollSchedule?.nextPayrollDate ?? '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Priority Actions */}
            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0">
              <CardContent className="space-y-5 p-6">
                <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80">Priority Actions</h3>

                <div className="space-y-3">
                  {canViewCompanyFinance && (
                    <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-lg flex items-start gap-4 hover:bg-destructive/10 transition-colors">
                      {overview.treasuryVaultConfigured ? <CheckCircleIcon className="text-emerald-400 size-5 shrink-0 mt-0.5" /> : <WarningIcon className="text-destructive size-5 shrink-0 mt-0.5" />}
                      <div>
                        <p className={overview.treasuryVaultConfigured ? 'text-sm font-bold text-emerald-400 leading-none' : 'text-sm font-bold text-destructive leading-none'}>
                          {overview.treasuryVaultConfigured ? 'Treasury vault configured' : 'Treasury vault missing'}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-2 font-medium leading-normal uppercase tracking-wider">
                          {overview.treasuryVaultConfigured ? formatAddress(overview.treasuryVault) : 'Company cannot execute payroll until vault is set.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-surface-container-highest/30 border border-white/5 rounded-lg flex items-start gap-4 hover:bg-surface-container-highest/50 transition-colors group">
                    <PendingActionsIcon className="text-tertiary size-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface leading-none">Salary setup</p>
                      <p className="text-[10px] text-on-surface-variant mt-2 font-medium leading-normal uppercase tracking-wider">
                        {overview.missingSalaryCount === 0 ? 'All active employees have encrypted salary handles.' : `${overview.missingSalaryCount} employee salary handle(s) missing.`}
                      </p>
                      {overview.salaryDecryptError && (
                        <p className="mt-3 text-[10px] font-bold text-destructive">{overview.salaryDecryptError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
