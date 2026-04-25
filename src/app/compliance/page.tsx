'use client'

import {
  MdAnalytics as AnalyticsIcon,
  MdAssignmentTurnedIn as AssignmentTurnedInIcon,
  MdContentCopy as ContentCopyIcon,
  MdHistory as HistoryIcon,
  MdKey as KeyIcon,
  MdLock as LockIcon,
  MdSecurity as SecurityIcon,
  MdVerifiedUser as VerifiedUserIcon,
  MdWorkspacePremium as WorkspacePremiumIcon,
} from 'react-icons/md'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

export default function CompliancePage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-12">

        {/* Section 1: Salary Fairness Audit (HR Restricted) */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LockIcon className="text-tertiary size-3.5 fill-current" />
                <span className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">Internal Audit Access Only</span>
              </div>
              <h2 className="font-heading text-3xl font-black text-on-surface tracking-tight">Salary Fairness Audit</h2>
            </div>
            <div className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest opacity-60">Last audited: 14 Oct 2023</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Card */}
            <div className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-between min-h-[260px] border border-white/5 shadow-2xl">
              <div>
                <h3 className="font-heading text-xl font-bold text-on-surface mb-3">Equity Analysis</h3>
                <p className="text-on-surface-variant text-sm font-medium leading-relaxed opacity-80">
                  Run a zero-knowledge aggregate report to verify median salary ranges across departments without exposing individual PII.
                </p>
              </div>
              <Button className="vault-gradient text-on-primary font-heading font-black text-xs h-14 rounded-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all border-none flex items-center justify-center gap-3">
                <AnalyticsIcon className="size-5" />
                GENERATE REPORT
              </Button>
            </div>

            {/* Processing Card */}
            <div className="bg-surface-container rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-6 border border-primary/10 shadow-2xl relative overflow-hidden">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-primary/5" />
                <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin shadow-[0_0_15px_#c0c1ff]" />
              </div>
              <div className="space-y-2 relative z-10">
                <p className="font-heading font-black text-primary uppercase tracking-widest text-sm">Computing on encrypted data...</p>
                <p className="text-[10px] text-on-surface-variant font-mono font-bold opacity-60">NODE_HASH: a7f8...e221</p>
              </div>
              <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
            </div>

            {/* Results Card */}
            <div className="bg-surface-container-highest rounded-xl p-8 flex flex-col gap-8 border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Aggregate Status</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">Verified</span>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-outline uppercase tracking-widest">Engineering Median</label>
                  <div className="h-12 bg-surface-container-lowest rounded-lg flex items-center px-4 overflow-hidden relative border border-white/5">
                    <div className="text-on-surface font-heading font-black text-sm relative z-10">Tier 4 Range</div>
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] opacity-30" />
                    <div className="ml-auto text-[10px] text-on-surface-variant font-black uppercase tracking-tighter opacity-40 relative z-10">(Confidential)</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-outline uppercase tracking-widest">Product Median</label>
                  <div className="h-12 bg-surface-container-lowest rounded-lg flex items-center px-4 overflow-hidden relative border border-white/5">
                    <div className="text-on-surface font-heading font-black text-sm relative z-10">Tier 3 Range</div>
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] opacity-30" />
                    <div className="ml-auto text-[10px] text-on-surface-variant font-black uppercase tracking-tighter opacity-40 relative z-10">(Confidential)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Salary Proofs (RWA) */}
        <section className="space-y-8">
          <div className="space-y-2 px-1">
            <h2 className="font-heading text-3xl font-black text-on-surface tracking-tight">Salary Proofs (RWA)</h2>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-2xl opacity-80">
              Generate cryptographically signed proofs for mortgage applications, rentals, or credit facilities without sharing your bank statements or exact salary.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
            {/* Generation Form (4/10) */}
            <div className="xl:col-span-4 bg-surface-container-low rounded-xl p-8 space-y-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center border border-white/10 shadow-inner">
                  <VerifiedUserIcon className="text-on-secondary-container size-7 fill-current" />
                </div>
                <h3 className="font-heading text-xl font-bold text-on-surface">Generate Proof</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Proof Type</label>
                  <div className="relative">
                    <select className="w-full bg-surface-container-lowest border-none rounded-lg text-on-surface text-sm font-bold py-4 px-5 appearance-none focus:ring-1 focus:ring-tertiary outline-none shadow-inner">
                      <option>Monthly Salary ≥ 5,000 USDC</option>
                      <option>Monthly Salary ≥ 10,000 USDC</option>
                      <option>Employment Duration ≥ 1 Year</option>
                      <option>Annual Total Compensation Proof</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Threshold</label>
                    <input className="w-full bg-surface-container-lowest border-none rounded-lg text-on-surface font-mono font-bold py-4 px-5 focus:ring-1 focus:ring-tertiary outline-none shadow-inner" type="text" defaultValue="5,000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Validity</label>
                    <select className="w-full bg-surface-container-lowest border-none rounded-lg text-on-surface text-sm font-bold py-4 px-5 appearance-none focus:ring-1 focus:ring-tertiary outline-none shadow-inner">
                      <option>30 Days</option>
                      <option>90 Days</option>
                      <option>Indefinite</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-surface-container-highest border border-white/10 text-on-surface font-heading font-black text-xs tracking-widest h-14 rounded-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-3">
                <KeyIcon className="size-5" />
                SIGN & MINT PROOF
              </Button>
            </div>

            {/* Recent Proofs List (6/10) */}
            <div className="xl:col-span-6 space-y-5">
              <h3 className="font-heading font-black uppercase tracking-[0.2em] text-xs text-on-surface opacity-80 px-1">Recent Issued Proofs</h3>
              <div className="space-y-3">
                {[
                  { icon: WorkspacePremiumIcon, title: 'Monthly Salary ≥ 5,000 USDC', status: 'Verified', id: '0x7d21...f9a2', expires: '12 Nov 2023', color: 'text-primary' },
                  { icon: AssignmentTurnedInIcon, title: 'Employment Duration ≥ 1 Year', status: 'Verified', id: '0xe119...88c4', expires: '24 Jan 2024', color: 'text-secondary' },
                  { icon: HistoryIcon, title: 'Historical Tax Proof FY22', status: 'Archived', id: '0x33e2...9011', expires: 'Expired 01 Oct', color: 'text-outline', isExpired: true },
                ].map(p => (
                  <div key={p.id} className="bg-surface-container rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 group hover:bg-surface-container-high transition-all border border-transparent hover:border-white/5 shadow-xl">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center border border-white/5">
                      <p.icon className={cn('size-6 fill-current', p.color)} />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                        <span className="font-heading font-bold text-on-surface">{p.title}</span>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border',
                          p.isExpired ? 'bg-outline/10 text-outline border-outline/20' : 'bg-primary/10 text-primary border-primary/20',
                        )}
                        >{p.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest text-outline">
                        <span>ID: <span className="text-on-surface-variant font-mono">{p.id}</span></span>
                        <span className="opacity-30">•</span>
                        <span>{p.isExpired ? p.expires : `Expires: ${p.expires}`}</span>
                      </div>
                    </div>
                    <button className={cn(
                      'flex items-center gap-2 bg-surface-container-lowest hover:bg-surface-container-highest px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5',
                      p.isExpired && 'opacity-50 cursor-not-allowed pointer-events-none',
                    )}
                    >
                      {p.isExpired ? <LockIcon className="size-3.5 fill-current" /> : <ContentCopyIcon className="size-3.5" />}
                      {p.isExpired ? 'Expired' : 'Copy Link'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Data Context Bar */}
        <footer className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 px-1">
          <div className="flex items-center gap-12">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-outline uppercase font-black tracking-[0.2em]">Total Vault Value</span>
              <span className="font-mono text-xl font-black text-on-surface tracking-tighter">$1,482,900.42</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-outline uppercase font-black tracking-[0.2em]">Network Latency</span>
              <span className="font-mono text-xl font-black text-primary tracking-tighter">12ms</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex -space-x-3">
              {['Z', 'M', 'E'].map(l => (
                <div key={l} className="w-9 h-9 rounded-full border-4 border-surface bg-surface-container-high flex items-center justify-center text-[11px] font-black text-white shadow-xl">{l}</div>
              ))}
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter flex items-center gap-2">
                <SecurityIcon className="size-3 fill-current text-tertiary" />
                MPC & ZK-PROOFS SECURED
              </p>
              <p className="text-[9px] text-outline font-medium uppercase tracking-widest mt-0.5">Sovereign Protocol v2.0.4</p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  )
}
