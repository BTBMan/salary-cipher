'use client'

import {
  MdAnalytics as AnalyticsIcon,
  MdCheckCircle as CheckCircleIcon,
  MdHistory as HistoryIcon,
  MdRefresh as RefreshIcon,
  MdShield as ShieldIcon,
  MdTableChart as TableChartIcon,
} from 'react-icons/md'
import { EncryptedField } from '@/components/encrypted-field'
import { AppLayout } from '@/components/layout/app-layout'
import { OnchainTransactionLink } from '@/components/onchain-transaction-link'
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
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { useComplianceAudit, useStoreContext } from '@/hooks'

function formatAuditDate(timestamp: number) {
  if (!timestamp) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
}

export default function CompliancePage() {
  const { selectedCompany } = useStoreContext()
  const {
    decryptAuditResult,
    generateAndFinalizeAudit,
    isDecryptingAuditResult,
    isGeneratingAudit,
    latestAudit,
    rows,
  } = useComplianceAudit(selectedCompany)
  const latestAuditResultLabel = !latestAudit
    ? 'No audit yet'
    : latestAudit.gapResult === null
      ? 'Encrypted'
      : latestAudit.gapResult
        ? 'Within threshold'
        : 'Review needed'

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-4 relative overflow-hidden rounded-xl border border-primary/10 bg-surface-container p-0 shadow-2xl">
            <CardContent className="min-h-86 p-8 overflow-hidden">
              <div className="absolute -right-20 -top-24 size-72 rounded-full bg-tertiary/15 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-px w-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent" />
              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div>
                    <div className="relative size-24">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/5" />
                      {isGeneratingAudit && <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />}
                      <div className="absolute inset-6 flex items-center justify-center rounded-full border border-white/10 bg-surface-container-low">
                        <ShieldIcon className="size-8 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h1 className="font-heading text-2xl font-black tracking-tight text-on-surface">Compliance</h1>
                    <p className="text-sm font-medium leading-7 text-on-surface-variant">
                      Run a confidential salary fairness audit for
                      {' '}
                      <span className="font-bold text-on-surface">{selectedCompany?.name ?? 'the selected company'}</span>
                      . The page is limited to company-level compliance and does not expose employee salary proofs.
                    </p>
                  </div>
                  <Badge className="h-8 rounded-full border-tertiary/20 bg-tertiary/10 px-4 text-tertiary">
                    FHE aggregate audit
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-4 rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
            <CardContent className="flex h-full flex-col justify-between gap-8 p-8">
              <div className="space-y-5">
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

              <Button
                className="h-12 rounded-sm border-none text-sm shadow-xl shadow-primary/20 vault-gradient text-on-primary-container"
                disabled={isGeneratingAudit || !selectedCompany}
                onClick={() => void generateAndFinalizeAudit()}
              >
                {isGeneratingAudit ? <RefreshIcon className="size-5 animate-spin" /> : <AnalyticsIcon className="size-5" />}
                {isGeneratingAudit ? 'Generating Audit...' : 'Generate Audit'}
              </Button>
            </CardContent>
          </Card>

          <Card className="xl:col-span-4 rounded-xl border border-white/5 bg-surface-container-highest p-0 shadow-2xl">
            <CardContent className="flex h-full flex-col gap-8 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">Audit result</p>
                  <h3 className="mt-2 font-heading text-xl font-black text-on-surface">{latestAudit ? ` #${latestAudit.auditId.toString()}` : ' pending'} Encrypted conclusion</h3>
                </div>
                <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 text-primary">{latestAudit ? 'On-chain' : 'Pending'}</Badge>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Salary gap check</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircleIcon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-black text-on-surface">{latestAuditResultLabel}</p>
                      <p className="mt-1 text-xs font-medium text-on-surface-variant">No individual salary values are displayed.</p>
                    </div>
                  </div>
                  {latestAudit?.gapHandle && (
                    <div className="mt-4">
                      <EncryptedField
                        canDecrypt={latestAudit.canDecrypt}
                        isDecrypting={isDecryptingAuditResult({
                          contractAddress: SalaryCipherCore.address,
                          handle: latestAudit.gapHandle,
                        })}
                        isEncrypted={latestAudit.gapResult === null}
                        onDecrypt={() => decryptAuditResult({
                          contractAddress: SalaryCipherCore.address,
                          handle: latestAudit.gapHandle!,
                        })}
                        value={latestAudit.gapResult === null ? latestAudit.gapHandle : latestAudit.gapResult ? 'Within threshold' : 'Review needed'}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Report hash</p>
                  <div className="mt-2">
                    {latestAudit?.hash
                      ? <OnchainTransactionLink transactionHash={latestAudit.hash} />
                      : <p className="break-all font-mono text-xs font-bold text-on-surface-variant">Generated after AuditGenerated event</p>}
                  </div>
                </div>
              </div>

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
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell className="py-8 text-center text-sm font-medium text-on-surface-variant" colSpan={4}>
                      No on-chain audit records yet.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map(row => (
                  <TableRow key={row.auditId.toString()}>
                    <TableCell className="font-mono text-xs font-bold text-on-surface-variant">{formatAuditDate(row.generatedAt)}</TableCell>
                    <TableCell className="font-medium text-on-surface">
                      {`#${row.auditId.toString()} / ${row.headcount.toString()} employees`}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-outline">
                      {row.hash ? <OnchainTransactionLink transactionHash={row.hash} /> : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 text-primary">{row.isFinalized ? 'Finalized' : 'Generated'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  )
}
