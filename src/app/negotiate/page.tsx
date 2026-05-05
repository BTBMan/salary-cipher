'use client'

import {
  MdAdd as AddIcon,
  MdArrowForward as ArrowForwardIcon,
  MdCancel as CancelIcon,
  MdCheckCircle as CheckCircleIcon,
  MdFingerprint as FingerprintIcon,
  MdGavel as GavelIcon,
  MdLock as LockIcon,
  MdPending as PendingIcon,
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
import { RolesEnum } from '@/enums'
import { useStoreContext } from '@/hooks'
import { cn } from '@/utils'

type NegotiationStatus = 'WaitingEmployerOffer' | 'WaitingEmployeeAsk' | 'ReadyToMatch' | 'Matched' | 'NoMatch' | 'Applied'

interface MockNegotiation {
  employee: string
  currentSalary: string
  initiator: 'Owner' | 'Employee'
  round: number
  status: NegotiationStatus
  updatedAt: string
}

const statusConfig: Record<NegotiationStatus, { label: string, className: string, icon?: typeof CheckCircleIcon }> = {
  WaitingEmployerOffer: {
    label: 'Waiting Employer Offer',
    className: 'bg-secondary-container/30 text-secondary',
  },
  WaitingEmployeeAsk: {
    label: 'Waiting Employee Ask',
    className: 'bg-surface-variant text-on-surface-variant',
  },
  ReadyToMatch: {
    label: 'Ready To Match',
    className: 'bg-amber-400/10 text-amber-300',
  },
  Matched: {
    label: 'Match',
    className: 'bg-emerald-500/10 text-emerald-400',
    icon: CheckCircleIcon,
  },
  NoMatch: {
    label: 'No Match',
    className: 'bg-destructive/10 text-destructive',
    icon: CancelIcon,
  },
  Applied: {
    label: 'Applied',
    className: 'bg-primary/10 text-primary',
    icon: CheckCircleIcon,
  },
}

const negotiations: MockNegotiation[] = [
  {
    employee: '0x71C...9e21',
    currentSalary: '•••• USDC',
    initiator: 'Employee',
    round: 1,
    status: 'WaitingEmployerOffer',
    updatedAt: '2h ago',
  },
  {
    employee: '0x4a2...f330',
    currentSalary: '•••• USDC',
    initiator: 'Owner',
    round: 2,
    status: 'Matched',
    updatedAt: '8h ago',
  },
  {
    employee: '0x992...2b01',
    currentSalary: '•••• USDT',
    initiator: 'Owner',
    round: 1,
    status: 'WaitingEmployeeAsk',
    updatedAt: '1d ago',
  },
  {
    employee: '0x11b...a8c2',
    currentSalary: '•••• USDC',
    initiator: 'Employee',
    round: 3,
    status: 'NoMatch',
    updatedAt: '2d ago',
  },
  {
    employee: '0x33e...d991',
    currentSalary: '•••• USDT',
    initiator: 'Owner',
    round: 1,
    status: 'Applied',
    updatedAt: '4d ago',
  },
]

export default function SalaryNegotiationPage() {
  const { selectedCompany } = useStoreContext()
  const isOwner = selectedCompany?.role === RolesEnum.Owner
  const canInitiateSelfRequest = selectedCompany?.role === RolesEnum.HR || selectedCompany?.role === RolesEnum.Employee
  const primaryInputLabel = isOwner ? 'Encrypted Employer Offer' : 'Encrypted Employee Ask'
  const primaryActionLabel = isOwner ? 'Create With Employer Offer' : 'Create My Adjustment Ask'
  const activeNegotiations = negotiations.filter(item => item.status !== 'Applied').length
  const pendingResponseCount = negotiations.filter(item => (
    isOwner
      ? item.status === 'WaitingEmployerOffer'
      : item.status === 'WaitingEmployeeAsk'
  )).length
  const matchedCount = negotiations.filter(item => item.status === 'Matched').length

  return (
    <AppLayout>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-heading font-black text-on-surface tracking-tight mb-3">Encrypted Salary Adjustment</h1>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
              Existing employees and company owners can both initiate a raise negotiation.
              <span className="text-tertiary font-bold italic"> Employer offer</span>
              {' '}
              and
              {' '}
              <span className="text-tertiary font-bold italic">employee ask</span>
              {' '}
              stay encrypted; the contract only reveals Match or No Match.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:flex">
            <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 border border-white/5 min-w-30">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Active</span>
              <span className="text-3xl font-heading font-black text-primary tracking-tighter">{activeNegotiations}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 border border-white/5 min-w-30">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Needs Reply</span>
              <span className="text-3xl font-heading font-black text-tertiary tracking-tighter">{pendingResponseCount}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 border border-white/5 min-w-30">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Matched</span>
              <span className="text-3xl font-heading font-black text-emerald-400 tracking-tighter">{matchedCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          <div className="lg:col-span-6 space-y-4">
            <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container-low py-0 shadow-2xl">
              <CardContent className="px-0">
                <div className="p-6 bg-surface-container/30 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-lg text-on-surface">Adjustment Negotiations</h4>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      {isOwner ? 'Company-wide view' : 'My salary adjustment records'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-highest/50 rounded-full text-[10px] text-tertiary font-black uppercase tracking-widest border border-tertiary/20">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ddb7ff]" />
                    FHE Matched
                  </div>
                </div>
                <Table className="text-left border-collapse">
                  <TableHeader>
                    <TableRow className="border-white/5 text-slate-500 hover:bg-transparent">
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Employee</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Round</TableHead>
                      <TableHead className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                      <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {negotiations.map((row) => {
                      const config = statusConfig[row.status]
                      const StatusIcon = config.icon
                      const needsOwnerReply = isOwner && row.status === 'WaitingEmployerOffer'
                      const needsEmployeeReply = !isOwner && row.status === 'WaitingEmployeeAsk'
                      const canApply = isOwner && row.status === 'Matched'
                      const actionLabel = canApply
                        ? 'Apply Salary'
                        : needsOwnerReply
                          ? 'Submit Offer'
                          : needsEmployeeReply
                            ? 'Submit Ask'
                            : row.status === 'NoMatch'
                              ? 'New Round'
                              : 'View'

                      return (
                        <TableRow key={`${row.employee}-${row.round}`} className="group cursor-pointer border-white/5 hover:bg-surface-container">
                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <FingerprintIcon className="size-4 text-primary" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-sm font-bold text-on-surface">{row.employee}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                  Current salary {row.currentSalary}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-sm font-black text-on-surface">#{row.round}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                By {row.initiator} · {row.updatedAt}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5 text-center">
                            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', config.className)}>
                              {StatusIcon && <StatusIcon className="size-2.5" />}
                              {config.label}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-5 text-right">
                            <Button
                              size="sm"
                              variant={canApply || needsOwnerReply || needsEmployeeReply ? 'default' : 'link'}
                              className={cn(
                                'h-8 rounded-sm text-sm',
                                canApply || needsOwnerReply || needsEmployeeReply
                                  ? 'bg-primary-container text-on-primary-container px-4 hover:opacity-90 border-none'
                                  : 'h-auto px-0 text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-on-surface',
                              )}
                            >
                              {actionLabel}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {(isOwner || canInitiateSelfRequest) && (
              <Card className="group relative overflow-hidden rounded-xl border border-primary/30 bg-surface-container p-0 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                <CardContent className="p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h5 className="font-heading font-black text-on-surface text-lg tracking-tight mb-1">
                          {isOwner ? 'Start Employee Adjustment' : 'Request Salary Adjustment'}
                        </h5>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-8 opacity-60">
                          {isOwner ? 'Choose an active employee and submit an encrypted offer' : 'Start with your encrypted ask, then wait for owner response'}
                        </p>
                      </div>
                      <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <AddIcon className="size-5 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {isOwner && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Target Employee</label>
                        <Input
                          className="h-12 rounded-lg border-none bg-surface-container-lowest px-4 py-4 font-mono font-bold shadow-inner focus-visible:ring-primary/30"
                          placeholder="0x..."
                          type="text"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{primaryInputLabel}</label>
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
                      {primaryActionLabel}
                    </Button>

                    <p className="text-[9px] text-center text-slate-500 font-bold leading-relaxed uppercase tracking-wider px-4">
                      The raw offer and ask stay private. Only the encrypted match result can be decrypted by both sides.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-xl">
              <CardContent className="space-y-5 p-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80 flex items-center gap-2">
                  <GavelIcon className="text-primary size-4 fill-current" />
                  Negotiation Rules
                </h5>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg bg-surface-container/40 p-3">
                    <SecurityIcon className="mt-0.5 size-4 shrink-0 text-tertiary" />
                    <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                      Only active HR and employee accounts with an existing monthly salary can negotiate.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-surface-container/40 p-3">
                    <PendingIcon className="mt-0.5 size-4 shrink-0 text-amber-300" />
                    <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                      Owner submits the encrypted employer offer. Employee submits the encrypted ask.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-surface-container/40 p-3">
                    <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                      Match means employee ask is less than or equal to employer offer. Owner applies the offer as the new salary.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-xl">
              <CardContent className="space-y-5 p-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80">Private Matching Path</h5>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="rounded-xl border border-tertiary/20 bg-tertiary/10 p-4">
                    <LockIcon className="mb-3 size-4 text-tertiary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">Employee Ask</p>
                    <p className="mt-2 font-mono text-sm font-black text-on-surface">••••••</p>
                  </div>
                  <ArrowForwardIcon className="size-5 text-outline" />
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <LockIcon className="mb-3 size-4 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Employer Offer</p>
                    <p className="mt-2 font-mono text-sm font-black text-on-surface">••••••</p>
                  </div>
                </div>
                <div className="rounded-xl bg-surface-container-highest/40 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Contract reveals</p>
                  <p className="mt-2 text-2xl font-heading font-black text-emerald-400">Match / No Match</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
