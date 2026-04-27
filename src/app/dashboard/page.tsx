'use client'

import {
  MdArrowForward as ArrowForwardIcon,
  MdLock as LockIcon,
  MdPendingActions as PendingActionsIcon,
  MdVerifiedUser as VerifiedUserIcon,
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

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Stats Section: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Managing Employees */}
          <div className="bg-surface-container-low p-5 rounded-lg transition-all hover:bg-surface-container border-b-2 border-transparent hover:border-primary/20 group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-3">Managing Employees</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-black text-on-surface">124</span>
              <span className="text-primary text-xs font-bold tracking-tight">+3 this mo.</span>
            </div>
          </div>

          {/* Stat 2: Encrypted Payroll */}
          <div className="bg-[#571bc1] p-5 rounded-lg transition-all shadow-[0_20px_40px_rgba(87,27,193,0.3)] relative overflow-hidden group border-none">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

            <p className="text-[#c4abff] text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <LockIcon className="size-3 fill-current" /> Total Monthly Payroll
            </p>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-mono font-bold blur-[6px] select-none text-white">642,150.00</span>
              <span className="text-[#c4abff] text-xs font-black uppercase tracking-tighter">USDC</span>
            </div>
            <div className="mt-3 text-[9px] text-[#c4abff]/60 tracking-[0.2em] font-black uppercase">FHE ENCRYPTED VAULT</div>
          </div>

          {/* Stat 3: Fund Pool Exhaustion */}
          <div className="bg-surface-container-low p-5 rounded-lg transition-all hover:bg-surface-container border-none group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-3">Fund Pool Exhaustion</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-black text-on-surface">22<span className="text-lg ml-0.5 text-on-surface-variant">d</span></span>
              <span className="text-destructive text-xs font-bold tracking-tight uppercase">Low Reserve</span>
            </div>
          </div>

          {/* Stat 4: Next Payday */}
          <div className="bg-surface-container-low p-5 rounded-lg transition-all hover:bg-surface-container border-none group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-3">Next Payday Arrival</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-heading font-black text-primary">05<span className="text-lg ml-0.5 opacity-60">d</span></span>
              <div className="flex-1 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[80%] rounded-full shadow-[0_0_8px_#c0c1ff]" />
              </div>
            </div>
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
                    {[
                      { date: 'Oct 12, 2023', block: 'Block #18,421,092', amount: '42,850.21' },
                      { date: 'Sep 28, 2023', block: 'Block #18,310,441', amount: '39,120.00' },
                      { date: 'Sep 14, 2023', block: 'Block #18,201,889', amount: '41,050.00' },
                      { date: 'Aug 30, 2023', block: 'Block #18,102,154', amount: '38,900.00' },
                    ].map(row => (
                      <TableRow key={row.block} className="group cursor-pointer border-white/5 hover:bg-surface-container">
                        <TableCell className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-on-surface text-sm font-bold">{row.date}</span>
                            <span className="text-outline text-[10px] font-mono mt-1">{row.block}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <LockIcon className="text-tertiary size-3.5 fill-current" />
                            <span className="font-mono text-sm blur-xs text-on-surface-variant font-bold">{row.amount}</span>
                            <span className="text-[10px] font-black text-outline uppercase tracking-tighter">USDC</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-sm border border-primary/20 uppercase tracking-widest">
                            On-Chain Settled
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (40%) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Fund Pool Health */}
            <Card className="rounded-xl border border-white/5 bg-surface-container p-0 shadow-2xl">
              <CardContent className="space-y-8 p-6">
                <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80">Fund Pool Health</h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-[10px] text-outline font-black uppercase tracking-[0.15em]">Encrypted Balance</span>
                      <span className="text-[9px] bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-tertiary/20">FHE Secured</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-white/10 shadow-inner">
                        <VerifiedUserIcon className="text-tertiary size-6 fill-current" />
                      </div>
                      <div>
                        <p className="text-2xl font-mono text-on-surface leading-none blur-md font-bold">1,240,500.00</p>
                        <p className="text-[10px] text-outline mt-1.5 font-bold uppercase tracking-wider">~ 1.8 months coverage</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-on-surface">Pool Utilization</span>
                      <span className="text-destructive">82%</span>
                    </div>
                    <div className="h-3 bg-surface-container-lowest rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div className="bg-linear-to-r from-primary to-destructive h-full w-[82%] rounded-full" />
                    </div>
                    <p className="text-[9px] text-outline italic text-right font-medium">Liquidity alert: Top-up recommended within 14 days.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Priority Actions */}
            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0">
              <CardContent className="space-y-5 p-6">
                <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80">Priority Actions</h3>

                <div className="space-y-3">
                  <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-lg flex items-start gap-4 hover:bg-destructive/10 transition-colors cursor-pointer">
                    <WarningIcon className="text-destructive size-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-destructive leading-none">Low funds warning</p>
                      <p className="text-[10px] text-destructive/70 mt-2 font-medium leading-normal uppercase tracking-wider">Gas vault below 0.5 ETH threshold.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-highest/30 border border-white/5 rounded-lg flex items-start gap-4 hover:bg-surface-container-highest/50 transition-colors cursor-pointer group">
                    <PendingActionsIcon className="text-tertiary size-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-on-surface leading-none">Pending Negotiation</p>
                      <p className="text-[10px] text-on-surface-variant mt-2 font-medium leading-normal uppercase tracking-wider">3 employee salary adjustments waiting for approval.</p>
                      <Button variant="link" size="sm" className="mt-3 h-auto px-0 text-[10px] font-black uppercase tracking-widest">
                        Review Proposals <ArrowForwardIcon className="size-3 ml-1.5" />
                      </Button>
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
