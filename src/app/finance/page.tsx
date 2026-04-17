'use client'

import {
  AccountBalanceWalletIcon,
  AddCircleIcon,
  ArrowUpwardIcon,
  DownloadIcon,
  FilterListIcon,
  LockIcon,
  OpenInNewIcon,
  PaymentsIcon,
  ShieldLockIcon,
} from '@/components/icons'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

export default function FinancePage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Top Header Section */}
        <div className="flex flex-col gap-1 px-1">
          <h1 className="text-3xl font-heading font-black text-on-surface tracking-tight">Finance & Vault</h1>
          <p className="text-on-surface-variant text-sm font-medium opacity-80">Managing liquidity and encrypted treasury operations for automated payroll.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden group border-l-4 border-primary shadow-2xl min-h-[280px] flex flex-col justify-between border-y-none border-r-none">
              <div className="relative z-10">
                <span className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] uppercase mb-4 block">Platform Balance</span>
                <div className="flex items-baseline gap-3 mb-10">
                  <div className="relative inline-flex flex-col">
                    <span className="text-primary font-heading text-5xl font-black tracking-tighter">482,910.42</span>
                    <div className="absolute inset-0 bg-secondary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-outline text-xl font-black uppercase tracking-tighter">USDC</span>
                </div>
                <div className="flex gap-4">
                  <Button className="flex-1 bg-primary text-on-primary h-14 rounded-lg font-heading font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all border-none shadow-lg shadow-primary/20">
                    <AddCircleIcon className="size-5" />
                    Deposit
                  </Button>
                  <Button variant="outline" className="flex-1 border-white/10 hover:bg-surface-container h-14 rounded-lg font-heading font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <ArrowUpwardIcon className="size-5" />
                    Withdraw
                  </Button>
                </div>
              </div>
              {/* Background Accent */}
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            </div>

            {/* Yield Metric */}
            <div className="bg-surface-container p-6 rounded-xl border border-white/5 flex justify-between items-center shadow-xl">
              <div>
                <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-1.5 block">Yield Generated (30d)</span>
                <span className="text-on-surface font-heading text-2xl font-black tracking-tight">+1,240.18 <span className="text-xs text-outline font-black">USDC</span></span>
              </div>
              <div className="h-10 w-24 bg-surface-container-low rounded-sm flex items-end gap-1 p-2 border border-white/5">
                <div className="w-2 bg-primary/40 h-1/2 rounded-t-[1px]" />
                <div className="w-2 bg-primary/60 h-2/3 rounded-t-[1px]" />
                <div className="w-2 bg-primary/80 h-3/4 rounded-t-[1px]" />
                <div className="w-2 bg-primary h-full rounded-t-[1px] shadow-[0_0_8px_#c0c1ff]" />
              </div>
            </div>
          </div>

          {/* Right Column: Vault Health (7/12) */}
          <div className="lg:col-span-7 bg-surface-container p-8 rounded-xl border border-white/5 relative shadow-2xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldLockIcon className="text-tertiary size-6 fill-current" />
                  <h3 className="text-white font-heading text-2xl font-bold tracking-tight">Company Fund Pool</h3>
                </div>
                <p className="text-on-surface-variant text-sm font-medium opacity-80">Automated reserve for encrypted payroll execution.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-on-surface-variant tracking-widest uppercase block mb-1.5 opacity-60">Health Status</span>
                <div className="flex items-center gap-2.5 justify-end">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">Optimal</span>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-on-surface opacity-80">Vault Utilization</span>
                  <span className="text-primary font-mono">74.2%</span>
                </div>
                <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div className="h-full bg-linear-to-r from-primary to-tertiary w-[74.2%] rounded-full shadow-[0_0_15px_rgba(192,193,255,0.4)]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 shadow-inner">
                  <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-2 block">Months Remaining</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-4xl font-heading font-black tracking-tighter">8.4</span>
                    <span className="text-outline text-xs font-black uppercase tracking-widest">Cycles</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 flex flex-col justify-center shadow-inner">
                  <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-4 block">Quick Top Up</span>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-lg">
                      +1m
                    </button>
                    <button className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-lg">
                      +3m
                    </button>
                    <button className="flex-1 bg-tertiary text-on-tertiary-fixed py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-tertiary/20">
                      Custom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-surface-container rounded-xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high/30">
            <h3 className="text-white font-heading text-xl font-bold tracking-tight">Transaction History</h3>
            <div className="flex items-center gap-6">
              <button className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white flex items-center gap-2 transition-colors">
                <FilterListIcon className="size-4" />
                Filter
              </button>
              <button className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white flex items-center gap-2 transition-colors">
                <DownloadIcon className="size-4" />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] bg-surface-container-low border-b border-white/5">
                  <th className="px-8 py-4">Execution Date</th>
                  <th className="px-8 py-4">Transaction Type</th>
                  <th className="px-8 py-4">Encrypted Amount</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">On-Chain Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { date: 'Oct 24, 2023', time: '14:22 UTC', type: 'Vault Deposit', amount: '45,000.00', icon: AccountBalanceWalletIcon, iconColor: 'text-primary', bgColor: 'bg-primary/10', hash: '0x4f...a812' },
                  { date: 'Oct 21, 2023', time: '09:15 UTC', type: 'Payroll Execution', amount: '122,402.10', icon: PaymentsIcon, iconColor: 'text-tertiary', bgColor: 'bg-tertiary/10', hash: '0x12...c4e9' },
                  { date: 'Oct 18, 2023', time: '18:40 UTC', type: 'Vault Deposit', amount: '80,000.00', icon: AccountBalanceWalletIcon, iconColor: 'text-primary', bgColor: 'bg-primary/10', hash: '0x9d...f221' },
                ].map(tx => (
                  <tr key={tx.hash} className="hover:bg-surface-container-high/40 transition-colors group cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="text-sm text-white font-bold tracking-tight">{tx.date}</div>
                      <div className="text-[10px] text-outline font-black uppercase mt-1 tracking-widest">{tx.time}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 shadow-inner', tx.bgColor)}>
                          <tx.icon className={cn('size-5', tx.iconColor)} />
                        </div>
                        <span className="text-sm text-white font-bold tracking-tight">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="relative w-36 h-10 bg-surface-container-lowest rounded-lg overflow-hidden flex items-center px-4 border border-white/5 group-hover:border-primary/30 transition-all">
                        <span className="text-sm font-['JetBrains_Mono'] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">{tx.amount}</span>
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] group-hover:hidden opacity-30" />
                        <LockIcon className="text-tertiary size-3.5 absolute right-3 opacity-60 group-hover:hidden fill-current" />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-sm border border-emerald-500/20">Confirmed</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="font-['JetBrains_Mono'] text-[11px] text-outline hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-2 font-bold group/hash">
                        {tx.hash}
                        <OpenInNewIcon className="size-3 opacity-60 group-hover/hash:opacity-100" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 text-center border-t border-white/5 bg-surface-container-lowest/10">
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">Load More Transactions</button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
