'use client'

import type { SalaryNegotiationRow } from '@/hooks'
import type { Address } from 'viem'
import { useMemo, useState } from 'react'
import {
  MdAdd as AddIcon,
  MdAutorenew as AutorenewIcon,
  MdCancel as CancelIcon,
  MdCheckCircle as CheckCircleIcon,
  MdGavel as GavelIcon,
  MdLock as LockIcon,
  MdSyncAlt,
  MdPending as PendingIcon,
  MdSecurity as SecurityIcon,
} from 'react-icons/md'
import { useConnection } from 'wagmi'
import { EncryptedField } from '@/components/encrypted-field'
import { AppLayout } from '@/components/layout/app-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RolesEnum } from '@/enums'
import { SalaryNegotiationStatus, useCompanyEmployees, useSalaryNegotiations, useStoreContext } from '@/hooks'
import { cn, formatAddress, formatUnixDate, getAvatarFallback, getConfidentialTokenSymbol } from '@/utils'

const statusConfig: Record<SalaryNegotiationStatus | 'Match' | 'NoMatch', { label: string, className: string, icon?: typeof CheckCircleIcon }> = {
  [SalaryNegotiationStatus.Open]: {
    label: 'Open',
    className: 'bg-surface-variant text-on-surface-variant',
  },
  [SalaryNegotiationStatus.WaitingEmployerOffer]: {
    label: 'Waiting Employer Offer',
    className: 'bg-secondary-container/30 text-secondary',
  },
  [SalaryNegotiationStatus.WaitingEmployeeAsk]: {
    label: 'Waiting Employee Ask',
    className: 'bg-surface-variant text-on-surface-variant',
  },
  [SalaryNegotiationStatus.ReadyToMatch]: {
    label: 'Ready To Match',
    className: 'bg-amber-400/10 text-amber-300',
  },
  [SalaryNegotiationStatus.Computed]: {
    label: 'Computed',
    className: 'bg-primary/10 text-primary',
  },
  [SalaryNegotiationStatus.Applied]: {
    label: 'Applied',
    className: 'bg-primary/10 text-primary',
    icon: CheckCircleIcon,
  },
  [SalaryNegotiationStatus.Cancelled]: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive',
    icon: CancelIcon,
  },
  Match: {
    label: 'Matched',
    className: 'bg-emerald-500/10 text-emerald-400',
    icon: CheckCircleIcon,
  },
  NoMatch: {
    label: 'Not Matched',
    className: 'bg-destructive/10 text-destructive',
    icon: CancelIcon,
  },
}

function getRowStatusKey(row: SalaryNegotiationRow) {
  if (row.status === SalaryNegotiationStatus.Computed && row.matchResult === true) {
    return 'Match'
  }
  if (row.status === SalaryNegotiationStatus.Computed && row.matchResult === false) {
    return 'NoMatch'
  }

  return row.status
}

export default function SalaryNegotiationPage() {
  const { address } = useConnection()
  const { selectedCompany } = useStoreContext()
  const people = useCompanyEmployees(selectedCompany)
  const negotiations = useSalaryNegotiations({
    employees: people.employees,
    refreshEmployees: people.refreshEmployees,
    selectedCompany,
  })
  const [requestedSelectedEmployee, setRequestedSelectedEmployee] = useState<Address | null>(null)
  const [salaryAmount, setSalaryAmount] = useState('')

  const isOwner = selectedCompany?.role === RolesEnum.Owner
  const selectedEmployee = useMemo(() => {
    if (!isOwner) {
      return null
    }
    if (requestedSelectedEmployee && negotiations.visibleEmployees.some(employee => employee.account.toLowerCase() === requestedSelectedEmployee.toLowerCase())) {
      return requestedSelectedEmployee
    }

    return negotiations.visibleEmployees[0]?.account ?? null
  }, [isOwner, negotiations.visibleEmployees, requestedSelectedEmployee])
  const currentEmployeeAddress = isOwner ? selectedEmployee : address ?? null
  const currentEmployeeRow = useMemo(() => {
    if (!currentEmployeeAddress) {
      return null
    }

    return negotiations.activeRows.find(row => row.employee.account.toLowerCase() === currentEmployeeAddress.toLowerCase()) ?? null
  }, [currentEmployeeAddress, negotiations.activeRows])

  const primaryInputLabel = isOwner ? 'Encrypted Employer Offer' : 'Encrypted Employee Ask'
  const primaryActionLabel = useMemo(() => {
    if (currentEmployeeRow?.canSubmitEmployerOffer) {
      return 'Submit Employer Offer'
    }
    if (currentEmployeeRow?.canSubmitEmployeeAsk) {
      return 'Submit Employee Ask'
    }
    if (currentEmployeeRow) {
      return 'Active Negotiation Exists'
    }

    return isOwner ? 'Create With Employer Offer' : 'Create My Adjustment Ask'
  }, [currentEmployeeRow, isOwner])
  const pendingResponseCount = negotiations.rows.filter(row => (
    isOwner
      ? row.status === SalaryNegotiationStatus.WaitingEmployerOffer
      : row.status === SalaryNegotiationStatus.WaitingEmployeeAsk
  )).length
  const matchedCount = negotiations.rows.filter(row => row.matchResult === true).length
  const salarySymbol = negotiations.selectedSettlementAsset?.symbol
  const confidentialTokenSymbol = getConfidentialTokenSymbol(negotiations.selectedSettlementAsset)
  const canUsePrimaryAction = Boolean(
    currentEmployeeAddress
    && salaryAmount
    && !negotiations.pendingAction
    && (currentEmployeeRow?.canSubmitEmployerOffer || currentEmployeeRow?.canSubmitEmployeeAsk || !currentEmployeeRow),
  )

  const handlePrimaryAction = async () => {
    if (!currentEmployeeAddress) {
      return
    }

    const succeeded = currentEmployeeRow?.canSubmitEmployerOffer
      ? await negotiations.submitEmployerOffer(currentEmployeeRow.id, salaryAmount)
      : currentEmployeeRow?.canSubmitEmployeeAsk
        ? await negotiations.submitEmployeeAsk(currentEmployeeRow.id, salaryAmount)
        : await negotiations.createAndSubmit(currentEmployeeAddress, salaryAmount)

    if (succeeded) {
      setSalaryAmount('')
    }
  }

  const renderRowAction = (row: SalaryNegotiationRow) => {
    const isPendingRow = negotiations.pendingAction?.endsWith(`:${row.id.toString()}`)

    if (row.canSubmitEmployerOffer || row.canSubmitEmployeeAsk) {
      return (
        <Button
          className="h-8 rounded-sm bg-primary-container px-4 text-sm text-on-primary-container hover:opacity-90"
          disabled={!salaryAmount || Boolean(negotiations.pendingAction)}
          size="sm"
          onClick={() => {
            void (row.canSubmitEmployerOffer
              ? negotiations.submitEmployerOffer(row.id, salaryAmount)
              : negotiations.submitEmployeeAsk(row.id, salaryAmount))
          }}
        >
          {isPendingRow ? 'Submitting' : row.canSubmitEmployerOffer ? 'Submit Offer' : 'Submit Ask'}
        </Button>
      )
    }

    if (row.canCompute) {
      return (
        <Button
          className="h-8 rounded-sm bg-primary-container px-4 text-sm text-on-primary-container hover:opacity-90"
          disabled={Boolean(negotiations.pendingAction)}
          size="sm"
          onClick={() => void negotiations.computeMatch(row.id)}
        >
          {isPendingRow ? 'Computing' : 'Compute'}
        </Button>
      )
    }

    if (row.status === SalaryNegotiationStatus.Computed && row.matchHandle && row.matchResult === null) {
      return (
        <Button
          className="h-8 rounded-sm px-4 text-sm"
          disabled={!negotiations.canDecryptMatch}
          size="sm"
          variant="tertiary"
          onClick={() => negotiations.decryptMatch(row)}
        >
          {negotiations.isDecryptingMatch(row) ? 'Decrypting' : 'Decrypt Result'}
        </Button>
      )
    }

    if (row.canApply) {
      return (
        <Button
          className="h-8 rounded-sm bg-primary-container px-4 text-sm text-on-primary-container hover:opacity-90"
          disabled={Boolean(negotiations.pendingAction)}
          size="sm"
          onClick={() => void negotiations.applyMatchedSalary(row.id)}
        >
          {isPendingRow ? 'Applying' : 'Apply Salary'}
        </Button>
      )
    }

    if (row.canStartNewRound) {
      return (
        <Button
          className="h-8 rounded-sm px-4 text-sm"
          disabled={Boolean(negotiations.pendingAction)}
          size="sm"
          variant="outline"
          onClick={() => void negotiations.newRound(row.id)}
        >
          {isPendingRow ? 'Starting' : 'New Round'}
        </Button>
      )
    }
  }

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
              stay encrypted; only authorized sides can decrypt the computed result.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:flex">
            <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1 border border-white/5 min-w-30">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Active</span>
              <span className="text-3xl font-heading font-black text-primary tracking-tighter">{negotiations.activeRows.length}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-x-4">
          <Card className="group col-span-4 relative overflow-hidden rounded-xl border border-primary/30 bg-surface-container p-0 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
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
                  <div className="size-8 shrink-0 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <AddIcon className="size-5 text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {isOwner && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Target Employee</label>
                    <Select<Address>
                      items={negotiations.visibleEmployees.map(employee => ({
                        label: employee.displayName,
                        value: employee.account,
                      }))}
                      value={selectedEmployee}
                      onValueChange={(employee) => {
                        if (employee !== null) {
                          setRequestedSelectedEmployee(employee)
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-lg border-none bg-surface-container-lowest font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {negotiations.visibleEmployees.map(employee => (
                          <SelectItem key={employee.account} value={employee.account}>
                            <span>{employee.displayName}</span>
                            <span className="font-mono text-[10px] text-outline">{formatAddress(employee.account)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      min="0"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={salaryAmount}
                      onChange={event => setSalaryAmount(event.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-[9px] font-black text-tertiary uppercase tracking-tighter opacity-60">{salarySymbol}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full primary-gradient text-on-primary-container h-12 rounded-sm text-sm shadow-xl shadow-primary/20 active:scale-[0.98] transition-all border-none"
                  disabled={!canUsePrimaryAction}
                  onClick={() => void handlePrimaryAction()}
                >
                  {negotiations.pendingAction?.startsWith('create:')
                    ? 'Submitting'
                    : primaryActionLabel}
                </Button>

                {currentEmployeeRow && (
                  <p className="text-[9px] text-center text-slate-500 font-bold leading-relaxed uppercase tracking-wider px-4">
                    This employee already has an active negotiation. Continue the pending side instead of creating another one.
                  </p>
                )}
                {!negotiations.isReady && (
                  <p className="text-[9px] text-center text-destructive font-bold leading-relaxed uppercase tracking-wider px-4">
                    Negotiation contract is not configured.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl col-span-3 border border-white/5 bg-surface-container-low p-0 shadow-xl">
            <CardContent className="space-y-5 p-6">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80 flex items-center gap-2">
                <GavelIcon className="text-primary size-4 fill-current" />
                Negotiation Rules
              </h5>
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-lg py-3">
                  <SecurityIcon className="mt-0.5 size-4 shrink-0 text-tertiary" />
                  <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                    Owner can view and manage all employee negotiations. Non-owner employees only see their own records.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-lg py-3">
                  <PendingIcon className="mt-0.5 size-4 shrink-0 text-amber-300" />
                  <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                    Owner submits the encrypted employer offer. Employee submits the encrypted ask.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-lg py-3">
                  <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
                    Owner can apply the new salary only after decrypting a matched result.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl col-span-3 border border-white/5 bg-surface-container-low p-0 shadow-xl">
            <CardContent className="space-y-5 p-6">
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80">Private Matching Path</h5>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-xl border border-tertiary/20 bg-tertiary/10 px-3 py-4">
                  <LockIcon className="mb-3 size-4 text-tertiary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">Employee Ask</p>
                  <p className="mt-2 font-mono text-sm font-black text-on-surface">Encrypted</p>
                </div>
                <MdSyncAlt className="size-5 text-outline" />
                <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-4">
                  <LockIcon className="mb-3 size-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Employer Offer</p>
                  <p className="mt-2 font-mono text-sm font-black text-on-surface">Encrypted</p>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-highest/40 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Authorized parties decrypt</p>
                <p className="mt-2 text-2xl font-heading font-black"><span className="text-emerald-400">Matched</span> / <span className="text-red-400">Not Matched</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="">
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
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Match Result</TableHead>
                    <TableHead className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                    <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {negotiations.isLoading || people.isLoadingEmployees
                    ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                            <div className="flex items-center justify-center gap-2">
                              <AutorenewIcon className="size-4 animate-spin" />
                              Loading negotiations from chain
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    : negotiations.rows.length === 0
                      ? (
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                              No salary adjustment negotiations found.
                            </TableCell>
                          </TableRow>
                        )
                      : negotiations.rows.map((row) => {
                          const statusKey = getRowStatusKey(row)
                          const config = statusConfig[statusKey]
                          const StatusIcon = config.icon
                          const salaryHandle = row.employee.monthlySalaryHandle

                          return (
                            <TableRow key={row.id.toString()} className="group cursor-pointer border-white/5 hover:bg-surface-container">
                              <TableCell className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-9 h-9 rounded-full border border-white/10">
                                    <AvatarFallback className="bg-primary/10 text-[9px] font-black text-primary">
                                      {getAvatarFallback(row.employee.displayName, row.employee.account)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-on-surface">{row.employee.displayName}</span>
                                    <span className="font-mono text-[10px] font-bold tracking-tighter text-outline">{formatAddress(row.employee.account)}</span>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                      Current salary:
                                      {' '}
                                      <EncryptedField
                                        canDecrypt={people.canDecryptSalary}
                                        className="inline-flex space-y-0"
                                        isDecrypting={salaryHandle ? people.isDecryptingSalaryHandle(salaryHandle) : people.isDecryptingSalary}
                                        isEncrypted={!row.employee.monthlySalary && Boolean(salaryHandle)}
                                        value={row.employee.monthlySalary ? `${row.employee.monthlySalary}` : salaryHandle ? formatAddress(salaryHandle) : 'Not set'}
                                        valueClassName="text-[10px] font-black uppercase tracking-widest text-tertiary"
                                        onDecrypt={() => {
                                          if (salaryHandle) {
                                            people.decryptSalaryHandle(salaryHandle)
                                          }
                                        }}
                                      />
                                      <span className="normal-case">{confidentialTokenSymbol}</span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-5">
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono text-sm font-black text-on-surface">#{row.id.toString()} / R{row.currentRound.toString()}</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                                    By {row.isEmployeeInitiated ? 'Employee' : 'Owner'} · {formatUnixDate(row.updatedAt)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-5">
                                {row.matchHandle
                                  ? (
                                      <EncryptedField
                                        canDecrypt={negotiations.canDecryptMatch}
                                        isDecrypting={negotiations.isDecryptingMatch(row)}
                                        isEncrypted={row.matchResult === null}
                                        value={row.matchResult === null ? formatAddress(row.matchHandle) : row.matchResult ? 'Matched' : 'Not Matched'}
                                        valueClassName={cn(
                                          'font-mono text-sm font-black',
                                          row.matchResult === true && 'text-emerald-400',
                                          row.matchResult === false && 'text-destructive',
                                          row.matchResult === null && 'text-tertiary',
                                        )}
                                        onDecrypt={() => negotiations.decryptMatch(row)}
                                      />
                                    )
                                  : <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Not Computed</span>}
                              </TableCell>
                              <TableCell className="px-6 py-5 text-center">
                                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', config.className)}>
                                  {StatusIcon && <StatusIcon className="size-2.5" />}
                                  {config.label}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-5">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {renderRowAction(row)}
                                  {row.canCancel && (
                                    <Button
                                      className="h-8 rounded-sm px-3 text-xs"
                                      disabled={Boolean(negotiations.pendingAction)}
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => void negotiations.cancelNegotiation(row.id)}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
