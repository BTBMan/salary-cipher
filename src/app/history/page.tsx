'use client'

import {
  CalendarMonthIcon,
  CurrencyExchangeIcon,
  EventRepeatIcon,
  FilterListIcon,
  HourglassEmptyIcon,
  KeyVisualizerIcon,
  LockIcon,
  OpenInNewIcon,
  SaveIcon,
  ShieldPersonIcon,
  TokenIcon,
} from '@/components/icons'
import { AppLayout } from '@/components/layout/app-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

export default function PayrollHistoryPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-10">

        {/* Payroll Configuration Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1 h-6 bg-primary rounded-full shadow-[0_0_8px_#c0c1ff]" />
            <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Payroll Configuration</h2>
          </div>
          <div className="bg-surface-container-low p-8 rounded-xl border border-white/5 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                  <EventRepeatIcon className="text-tertiary size-4" />
                  Pay Cycle Frequency
                </label>
                <div className="relative">
                  <select className="w-full bg-surface-container-lowest border-none rounded-lg text-on-surface text-sm font-bold py-3 px-4 focus:ring-1 focus:ring-tertiary/40 transition-all cursor-pointer appearance-none outline-none shadow-inner">
                    <option>Monthly - 1st of month</option>
                    <option>Bi-Weekly - Every 15th</option>
                    <option>Weekly - Friday</option>
                    <option>Custom Epoch</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                  <CurrencyExchangeIcon className="text-tertiary size-4" />
                  Disbursement Asset
                </label>
                <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-white/5 shadow-inner">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <TokenIcon className="size-3 text-indigo-400" />
                  </div>
                  <span className="font-mono text-xs font-black tracking-widest text-on-surface">USDC (Base Mainnet)</span>
                </div>
              </div>
              <div>
                <Button className="primary-gradient text-on-primary font-heading font-black text-xs tracking-widest h-12 px-8 rounded-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all border-none flex items-center gap-2">
                  <SaveIcon className="size-4" />
                  SAVE SETTINGS
                </Button>
              </div>
            </div>
          </div>
        </section>

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
                <select className="pl-9 pr-8 py-2 bg-surface-container border-none text-[10px] font-black uppercase tracking-widest text-on-surface-variant focus:ring-0 cursor-pointer rounded-lg shadow-lg outline-none appearance-none">
                  <option>Last 30 Days</option>
                  <option>Q3 2024</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="relative">
                <FilterListIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-4" />
                <select className="pl-9 pr-8 py-2 bg-surface-container border-none text-[10px] font-black uppercase tracking-widest text-on-surface-variant focus:ring-0 cursor-pointer rounded-lg shadow-lg outline-none appearance-none">
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-high/50 text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-6 py-4 font-black">Execution Date</th>
                    <th className="px-6 py-4 font-black">Employee Entity</th>
                    <th className="px-6 py-4 font-black">Amount (FHE)</th>
                    <th className="px-6 py-4 font-black">Status</th>
                    <th className="px-6 py-4 text-right font-black">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { date: '2024-10-01', name: 'Alex Rivera', wallet: '0x71C...92Aa', amount: '4,250.00', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl8eVdHzCEqknVUBpPULD_sxi-r29S1BmZL__PqQ9th7TnTeAF1_QXkfA2tk9raiDcgAux1RU_-su_yr1F0wUIwMpvwGzDkt9hWMCs1F5R7RCeuzAHenJVmSOvFMh1yhXwh5jSW7hoM3VXSbwbFerRosi1hwN3PS3Ks8xWUW1N1YK9Uj2yYLExwur_63rACwvoeervuooaiwdoT6O51Tx68y5cJ-Boi-K9UsrPlh7MBNCCYDZ1X0qXlDxog8gDv-jtjsS5sf3qWY4', status: 'Paid', color: 'text-primary' },
                    { date: '2024-10-01', name: 'Sarah Chen', wallet: '0x42B...11Ee', amount: '5,800.00', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIo9hkn6hFtXXBlBOdFvoDU-8MpUsTU50TsNvPhNeLhmEgQZMfOUNsY7V4kGFqh8sKRbpCnDLzxnu6h-nXwu7VRqAZfXsH9GaJ-oa6inChJhmfx3fu8Soo_j0SBvtmdDXRr1P-wIElZJ3OjYCYVUo6msm4p7yfebi_LH4THl6tX_kFeX9XGyNX3vUZRw8CQih4tUjMt46UxbN136RTq-D223QAHR_kwIlgz-O8V2qd3wNUUufXjW9wMagC7X4RBcL4xfUaoh5gJQE', status: 'Paid', color: 'text-primary' },
                    { date: '2024-09-28', name: 'Marcus Thorne', wallet: '0x99A...33Cc', amount: '12,100.00', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOGE8frGr_w0KofYiZzntvxZy-9VTdKdBrJGgK__UsXQFQwUXz9vCCNII44sh423l7RTcseA0-wIwSdJ9XIZAFOt_fA6ZbqU-1DgohhzJDp1cy25ExJN4dYgBqMr-VnUHv2Tp73QJ-Z_qi6SUqwIbpDXxEFMMTycmYEv8KlgfdktJo_QbA7ymge6rE6OYxi2wHTXEwRnuMHha2ncajH3DdQAo2xWDncHlP1ToqZFUl4aDJDZ1kKdwBYUmJM-kEgnxC8Ua1Q6tw38', status: 'Pending', color: 'text-amber-500', isPending: true },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-bright/10 transition-colors group cursor-pointer">
                      <td className="px-6 py-5 font-mono text-sm font-bold text-on-surface">{row.date}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 rounded-full border border-white/10">
                            <AvatarImage src={row.icon} className="object-cover" />
                            <AvatarFallback className="bg-surface-variant text-[8px] font-black">{row.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-on-surface leading-tight">{row.name}</span>
                            <span className="font-mono text-[10px] text-outline font-bold tracking-tighter">{row.wallet}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 bg-surface-container-lowest border border-tertiary/10 px-3 py-1.5 rounded-lg group-hover:border-tertiary/40 transition-all relative overflow-hidden">
                          <span className="font-mono text-sm text-tertiary blur-[4px] group-hover:blur-0 transition-all font-bold">{row.amount} <span className="text-[10px] text-outline font-black">USDC</span></span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] group-hover:hidden opacity-30" />
                          <LockIcon className="size-3 text-tertiary fill-current group-hover:hidden" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
                          row.isPending ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20',
                        )}
                        >
                          <div className={cn('w-1.5 h-1.5 rounded-full', row.isPending ? 'bg-amber-500' : 'bg-primary')} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {row.isPending
                          ? (
                              <div className="flex items-center justify-end gap-2 text-[10px] font-black text-outline uppercase tracking-widest opacity-40 cursor-not-allowed">
                                Awaiting Block
                                <HourglassEmptyIcon className="size-3" />
                              </div>
                            )
                          : (
                              <button className="text-[10px] font-black text-outline hover:text-primary transition-colors flex items-center justify-end gap-2 uppercase tracking-widest ml-auto">
                                View Proof
                                <OpenInNewIcon className="size-3" />
                              </button>
                            )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Row */}
            <div className="bg-surface-container-highest px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-white/10 shadow-inner">
                  <ShieldPersonIcon className="text-primary size-7 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant mb-1.5 opacity-60">Vault Liquidity</p>
                  <p className="font-mono text-lg font-black text-on-surface tracking-tighter">142,500.00 <span className="text-xs text-outline uppercase">USDC</span></p>
                </div>
              </div>
              <div className="bg-surface-container-lowest/40 border border-white/5 px-8 py-4 rounded-xl flex flex-col items-center md:items-end group cursor-pointer relative overflow-hidden shadow-2xl max-w-xs w-full transition-all hover:bg-surface-container-lowest/60">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-tertiary mb-1.5 opacity-80">Total Disbursed (Encrypted Sum)</p>
                <div className="flex items-center gap-4 relative z-10">
                  <span className="font-mono text-2xl font-black text-white blur-[6px] group-hover:blur-0 transition-all duration-700 tracking-tighter">764,212.85 <span className="text-xs text-outline uppercase">USDC</span></span>
                  <KeyVisualizerIcon className="text-tertiary size-5 fill-current" />
                </div>
                {/* Shimmer Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] group-hover:hidden opacity-30" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
