'use client'

import {
  MdAnalytics as AnalyticsIcon,
  MdCheckCircle as CheckCircleIcon,
  MdDownload as DownloadIcon,
  MdGavel as GavelIcon,
  MdHistory as HistoryIcon,
  MdLock as LockIcon,
  MdShield as ShieldIcon,
  MdTableChart as TableChartIcon,
} from 'react-icons/md'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
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
import { useStoreContext } from '@/hooks'

const auditRows = [
  {
    generatedAt: 'Pending on-chain integration',
    hash: 'Audit ID will appear after generateAudit()',
    scope: 'All active HR / employees',
    status: 'Ready',
  },
  {
    generatedAt: 'Design sample',
    hash: '0xa7f8...e221',
    scope: 'Company-wide salary gap',
    status: 'Verified',
  },
]

export default function CompliancePage() {
  const { selectedCompany } = useStoreContext()

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface-container-low p-8 shadow-2xl">
          <div className="absolute -right-20 -top-24 size-72 rounded-full bg-tertiary/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-px w-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2">
                <LockIcon className="size-4 text-tertiary" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-tertiary">Owner / HR Internal Access</span>
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-black tracking-tight text-on-surface">Compliance</h1>
                <p className="text-sm font-medium leading-7 text-on-surface-variant">
                  Run a confidential salary fairness audit for
                  {' '}
                  <span className="font-bold text-on-surface">{selectedCompany?.name ?? 'the selected company'}</span>
                  . The page is limited to company-level compliance and does not expose employee salary proofs.
                </p>
              </div>
            </div>
            <Badge className="h-8 rounded-full border-tertiary/20 bg-tertiary/10 px-4 text-tertiary">
              FHE aggregate audit
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4 rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
            <CardContent className="flex h-full flex-col justify-between gap-8 p-8">
              <div className="space-y-5">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-primary-container/15">
                  <AnalyticsIcon className="size-7 text-primary" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-heading text-2xl font-black tracking-tight text-on-surface">Salary Fairness Audit</h2>
                  <p className="text-sm font-medium leading-6 text-on-surface-variant">
                    Generate an encrypted salary distribution snapshot. The contract compares aggregate salary ranges without revealing individual compensation.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-outline">
                  <TableChartIcon className="size-4" />
                  Current audit scope
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Members</p>
                    <p className="mt-1 font-heading font-black text-on-surface">HR + Employees</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Rule</p>
                    <p className="mt-1 font-heading font-black text-on-surface">Gap threshold</p>
                  </div>
                </div>
              </div>

              <Button className="h-12 rounded-sm border-none text-sm shadow-xl shadow-primary/20 vault-gradient text-on-primary-container">
                <AnalyticsIcon className="size-5" />
                Generate Audit
              </Button>
            </CardContent>
          </Card>

          <Card className="xl:col-span-4 relative overflow-hidden rounded-xl border border-primary/10 bg-surface-container p-0 shadow-2xl">
            <CardContent className="flex min-h-86 flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="relative size-24">
                <div className="absolute inset-0 rounded-full border-4 border-primary/5" />
                <div className="absolute inset-0 animate-spin rounded-full border-t-4 border-primary shadow-[0_0_18px_rgba(192,193,255,0.65)]" />
                <div className="absolute inset-6 flex items-center justify-center rounded-full border border-white/10 bg-surface-container-low">
                  <ShieldIcon className="size-8 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="font-heading text-sm font-black uppercase tracking-[0.2em] text-primary">Computing on encrypted data</p>
                <p className="mx-auto max-w-xs text-sm font-medium leading-6 text-on-surface-variant">
                  Audit result is stored as an encrypted boolean. Owner and HR can decrypt only the final compliance conclusion.
                </p>
              </div>
              <div className="absolute inset-0 pointer-events-none bg-primary/5 animate-pulse" />
            </CardContent>
          </Card>

          <Card className="xl:col-span-4 rounded-xl border border-white/5 bg-surface-container-highest p-0 shadow-2xl">
            <CardContent className="flex h-full flex-col justify-between gap-8 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">Audit result</p>
                  <h3 className="mt-2 font-heading text-xl font-black text-on-surface">Encrypted conclusion</h3>
                </div>
                <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 text-primary">Pending</Badge>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Salary gap check</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircleIcon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-black text-on-surface">Ready for decryption</p>
                      <p className="mt-1 text-xs font-medium text-on-surface-variant">No individual salary values are displayed.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Report hash</p>
                  <p className="mt-2 break-all font-mono text-xs font-bold text-on-surface-variant">Generated after AuditGenerated event</p>
                </div>
              </div>

              <Button variant="outline" className="h-11 rounded-sm text-xs font-black uppercase tracking-widest" disabled>
                <DownloadIcon className="size-4" />
                Download Report
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <div>
                <h2 className="font-heading text-xl font-black text-on-surface">Audit History</h2>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Company-level audit records only. Personal salary proofs are separated into Salary Proofs.</p>
              </div>
              <HistoryIcon className="size-5 text-outline" />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Generated</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Audit hash</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRows.map(row => (
                  <TableRow key={`${row.generatedAt}-${row.hash}`}>
                    <TableCell className="font-mono text-xs font-bold text-on-surface-variant">{row.generatedAt}</TableCell>
                    <TableCell className="font-medium text-on-surface">{row.scope}</TableCell>
                    <TableCell className="font-mono text-xs text-outline">{row.hash}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 text-primary">{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-tertiary/15 bg-tertiary/5 p-0">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tertiary/10">
                <GavelIcon className="size-6 text-tertiary" />
              </div>
              <div>
                <h3 className="font-heading text-base font-black text-on-surface">What was removed from Compliance</h3>
                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-on-surface-variant">
                  Personal salary proof generation, verifier authorization, and RWA NFT preview now belong to Salary Proofs. This keeps company audit data separate from employee-controlled credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
