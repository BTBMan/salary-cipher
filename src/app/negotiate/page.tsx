'use client'

import {
  MdCancel as CancelIcon,
  MdCheckCircle as CheckCircleIcon,
  MdFingerprint as FingerprintIcon,
  MdLock as LockIcon,
  MdSecurity as SecurityIcon,
} from 'react-icons/md'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { canSubmitEmployerBudget, canSubmitExpectedSalary } from '@/constants'
import { useStoreContext } from '@/hooks'
import { cn } from '@/utils'

export default function SalaryNegotiationPage() {
  const { selectedCompany } = useStoreContext()
  const canSetBudget = canSubmitEmployerBudget(selectedCompany?.role)
  const canSubmitExpectation = canSubmitExpectedSalary(selectedCompany?.role)
  const activeActionLabel = canSetBudget ? 'Set Budget' : 'Submit Expectation'

  return (
    <AppLayout>
      <div className="flex flex-col gap-10">
        {/* Info Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-heading font-black text-on-surface tracking-tight mb-3">Cryptographic Wage Matching</h1>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
              Both parties' bids are fully encrypted using <span className="text-tertiary font-bold italic">Fully Homomorphic Encryption</span>.
              The smart contract matches automatically within the Zama protocol, only revealing the final result to prevent negotiation bias and maintain sovereign privacy.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 border border-white/5 min-w-30">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Active Bids</span>
              <span className="text-3xl font-heading font-black text-primary tracking-tighter">14</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 border border-white/5 min-w-30">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Match Rate</span>
              <span className="text-3xl font-heading font-black text-tertiary tracking-tighter">84%</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

          {/* Left: Pending Negotiations (60%) */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container-low py-0 shadow-2xl">
              <CardContent className="px-0">
                <div className="p-6 bg-surface-container/30 border-b border-white/5 flex items-center justify-between">
                  <h4 className="font-heading font-bold text-lg text-on-surface">Pending Negotiations</h4>
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-highest/50 rounded-full text-[10px] text-tertiary font-black uppercase tracking-widest border border-tertiary/20">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ddb7ff]" />
                    On-Chain Live
                  </div>
                </div>
                <Table className="text-left border-collapse">
                  <TableHeader>
                    <TableRow className="border-white/5 text-slate-500 hover:bg-transparent">
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Employee Identity</TableHead>
                      <TableHead className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                      <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: '0x71C...9e21', status: 'Waiting for Employer', color: 'bg-secondary-container/30 text-secondary', active: true },
                      { id: '0x4a2...f330', status: 'Match', color: 'bg-emerald-500/10 text-emerald-400', isMatch: true },
                      { id: '0x992...2b01', status: 'Waiting for Employee', color: 'bg-surface-variant text-on-surface-variant' },
                      { id: '0x11b...a8c2', status: 'No Match', color: 'bg-destructive/10 text-destructive', isNoMatch: true },
                      { id: '0x33e...d991', status: 'Match', color: 'bg-emerald-500/10 text-emerald-400', isMatch: true },
                    ].map(row => (
                      <TableRow key={row.id} className="group cursor-pointer border-white/5 hover:bg-surface-container">
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                              <FingerprintIcon className="size-4 text-primary" />
                            </div>
                            <span className="font-mono text-sm font-bold text-on-surface">{row.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-center">
                          <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', row.color)}>
                            {row.isMatch && <CheckCircleIcon className="size-2.5 inline-block mr-1.5 -mt-0.5" />}
                            {row.isNoMatch && <CancelIcon className="size-2.5 inline-block mr-1.5 -mt-0.5" />}
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          {row.active
                            ? (
                                <Button size="sm" className="bg-primary-container text-on-primary-container h-8 px-4 rounded-sm text-sm hover:opacity-90 border-none">{activeActionLabel}</Button>
                              )
                            : (
                                <Button variant="link" size="sm" className="h-auto px-0 text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-on-surface">
                                  {row.isMatch ? 'View Hash' : 'Encrypted'}
                                </Button>
                              )}
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

            {(canSetBudget || canSubmitExpectation) && (
              <Card className="group relative overflow-hidden rounded-xl border border-primary/30 bg-surface-container p-0 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                <CardContent className="p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  <h5 className="font-heading font-black text-on-surface text-lg tracking-tight mb-1">{canSetBudget ? 'Set Employee Budget' : 'Submit Expected Salary'}</h5>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-8 opacity-60">Target: 0x71C...9e21</p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{canSetBudget ? 'Encrypted Budget ($)' : 'Encrypted Expected Salary ($)'}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockIcon className="size-4 text-tertiary fill-current" />
                        </div>
                        <Input
                          className="h-12 rounded-lg border-none bg-surface-container-lowest px-10 py-4 font-mono font-bold shadow-inner focus-visible:ring-tertiary/30"
                          placeholder="••••••••"
                          type="text"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-[9px] font-black text-tertiary uppercase tracking-tighter opacity-60">FHE SECURE</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full primary-gradient text-on-primary-container h-12 rounded-sm text-sm shadow-xl shadow-primary/20 active:scale-[0.98] transition-all border-none">
                      {canSetBudget ? 'Commit Encrypted Budget' : 'Submit Encrypted Expectation'}
                    </Button>

                    <p className="text-[9px] text-center text-slate-500 font-bold leading-relaxed uppercase tracking-wider px-4">
                      Your bid is masked using a random salt before being added to the homomorphic pool.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Protocol Status */}
            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-xl">
              <CardContent className="space-y-5 p-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80 flex items-center gap-2">
                  <SecurityIcon className="text-primary size-4 fill-current" />
                  Vault Health
                </h5>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-on-surface-variant">Protocol Version</span>
                    <span className="font-mono text-tertiary">v2.0.4-FHE</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-on-surface-variant">Active Peer Nodes</span>
                    <span className="font-mono">12 / 12</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[80%] rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulated Data Visualizer */}
            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-xl">
              <CardContent className="overflow-hidden p-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80 mb-6">Entropy Distribution</h5>
                <div className="flex items-end gap-1.5 h-20">
                  {[
                    { id: 'a', height: 50 },
                    { id: 'b', height: 75 },
                    { id: 'c', height: 60 },
                    { id: 'd', height: 100 },
                    { id: 'e', height: 85 },
                    { id: 'f', height: 50 },
                    { id: 'g', height: 30 },
                    { id: 'h', height: 65 },
                    { id: 'i', height: 75 },
                    { id: 'j', height: 40 },
                    { id: 'k', height: 90 },
                    { id: 'l', height: 55 },
                  ].map((bar, i) => (
                    <div
                      key={bar.id}
                      className={cn(
                        'flex-1 rounded-t-[2px] transition-all duration-1000',
                        i % 4 === 0 ? 'bg-tertiary/40' : 'bg-primary/30',
                      )}
                      style={{ height: `${bar.height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-[8px] text-slate-500 font-mono font-black uppercase tracking-widest">
                  <span>0x00...</span>
                  <span className="animate-pulse">Scanning...</span>
                  <span>0xFF...</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
