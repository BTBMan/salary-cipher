'use client'

import {
  AccountBalanceIcon,
  AddIcon,
  DescriptionIcon,
  DirectionsCarIcon,
  EncryptedIcon,
  HomeIcon,
  LockIcon,
  ScheduleIcon,
  VerifiedUserIcon,
  VisibilityIcon,
} from '@/components/icons'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

export default function EmployeeDashboardPage() {
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
              <span className="font-mono text-2xl font-black blur-[6px] select-none text-white opacity-40">8,450.00</span>
              <span className="font-mono text-[10px] font-black text-outline uppercase tracking-tighter">USDC</span>
            </div>
            <p className="mt-3 text-[9px] text-slate-500 font-black uppercase tracking-widest">Auto-renewing on 1st</p>
          </div>

          {/* Earned This Period */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-tertiary group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Earned This Period</span>
              <EncryptedIcon className="text-tertiary size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black blur-[6px] select-none text-white opacity-40">3,212.45</span>
              <span className="font-mono text-[10px] font-black text-outline uppercase tracking-tighter">USDC</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-surface-container-low rounded-full overflow-hidden shadow-inner">
                <div className="h-full w-[65%] bg-tertiary rounded-full" />
              </div>
              <span className="text-[9px] font-black font-mono text-tertiary">65%</span>
            </div>
          </div>

          {/* Total Received */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-[#d0bcff] group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Total Received</span>
              <AccountBalanceIcon className="text-[#d0bcff] size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black blur-[6px] select-none text-white opacity-40">101,400.00</span>
              <span className="font-mono text-[10px] font-black text-outline uppercase tracking-tighter">USDC</span>
            </div>
            <p className="mt-3 text-[9px] text-slate-500 font-black uppercase tracking-widest">Fiscal Year 2024</p>
          </div>

          {/* Next Payday */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-primary-container group hover:bg-surface-container-high transition-all cursor-pointer border-y-none border-r-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-on-surface-variant tracking-[0.15em] uppercase">Next Payday</span>
              <ScheduleIcon className="text-primary-container size-3.5 fill-current" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-heading font-black text-on-surface tracking-tighter">5</span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Days Left</span>
            </div>
            <div className="flex gap-1 mt-3.5">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-1 flex-1 bg-primary-container rounded-full shadow-[0_0_4px_#8083ff]" />)}
              {[1, 2].map(i => <div key={i} className="h-1 flex-1 bg-surface-container-lowest rounded-full" />)}
            </div>
          </div>
        </section>

        {/* Content Grid: 6:4 Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

          {/* Left: Salary History (60%) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading text-xl font-bold text-on-surface tracking-tight">My Salary History</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Download CSV</button>
            </div>
            <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container text-[10px] font-black uppercase tracking-[0.2em] text-outline border-b border-white/5">
                    <th className="px-6 py-5">Execution Time</th>
                    <th className="px-6 py-5">Encrypted Amount</th>
                    <th className="px-6 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { date: 'May 01, 2024', tx: '0x98f...e1d', amount: '8,450.00' },
                    { date: 'April 01, 2024', tx: '0x24a...77b', amount: '8,450.00' },
                    { date: 'March 01, 2024', tx: '0xc12...89a', amount: '7,920.00' },
                    { date: 'February 01, 2024', tx: '0xb55...21c', amount: '7,920.00' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container transition-colors group cursor-pointer">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">{row.date}</span>
                          <span className="text-[10px] text-outline font-mono mt-1 font-bold uppercase tracking-widest">Tx: {row.tx}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm blur-[4px] text-on-surface-variant font-bold">{row.amount}</span>
                          <span className="text-[10px] font-black text-outline uppercase tracking-tighter">USDC</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-sm border border-primary/20 uppercase tracking-widest">Settled</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-surface-container-lowest/20 text-center border-t border-white/5">
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-on-surface transition-colors">View All History</button>
              </div>
            </div>
          </div>

          {/* Right: Income Proofs (40%) */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80 px-1">Proof Center</h3>

            {/* Proof CTA Card */}
            <div className="relative bg-surface-container p-6 rounded-xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-surface-container-highest rounded-xl flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                  <VerifiedUserIcon className="text-tertiary size-8 fill-current" />
                </div>
                <h3 className="font-heading text-xl font-bold text-on-surface tracking-tight mb-2">RWA Income Proofs</h3>
                <p className="text-on-surface-variant text-xs font-medium leading-relaxed mb-8 opacity-80">
                  Generate zero-knowledge proofs for mortgage or loan applications without revealing your actual salary.
                </p>
                <Button className="primary-gradient text-on-primary font-heading font-black text-xs h-10 px-6 rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2 border-none">
                  <AddIcon className="size-4" />
                  Generate New Proof
                </Button>
              </div>
              {/* Massive background icon */}
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 pointer-events-none transform rotate-12 group-hover:scale-110 transition-all duration-700">
                <VerifiedUserIcon className="size-48 fill-current" />
              </div>
            </div>

            {/* Recent Proofs List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant px-1">Active Proof Sessions</h4>
              <div className="space-y-2.5">
                {[
                  { icon: HomeIcon, title: 'Mortgage Eligibility', sub: 'Used: Wells Fargo API', color: 'text-primary' },
                  { icon: DirectionsCarIcon, title: 'Auto Loan Check', sub: 'Used: Chase Auto', color: 'text-tertiary' },
                  { icon: DescriptionIcon, title: 'Generic Income Level', sub: 'Tier: Platinum (+5k/mo)', color: 'text-emerald-400' },
                ].map((p, i) => (
                  <div key={i} className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-all cursor-pointer border border-transparent hover:border-white/5 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <p.icon className={cn('size-5', p.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface leading-none">{p.title}</p>
                        <p className="text-[10px] text-outline font-bold mt-1.5 uppercase tracking-widest">{p.sub}</p>
                      </div>
                    </div>
                    <button className="p-2 text-outline group-hover:text-primary transition-colors">
                      <VisibilityIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
