'use client'

import type { AssignableCompanyRole } from '@/constants'
import { useState } from 'react'
import {
  MdAccountBalanceWallet as AccountBalanceWalletIcon,
  MdArrowBack as ArrowBackIcon,
  MdArrowForward as ArrowForwardIcon,
  MdCheckCircle as CheckCircleIcon,
  MdFingerprint as FingerprintIcon,
  MdLock as LockIcon,
  MdPersonAdd as PersonAddIcon,
  MdSecurity as SecurityIcon,
} from 'react-icons/md'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ASSIGNABLE_COMPANY_ROLE_OPTIONS, ROLE_LABELS } from '@/constants'
import { RolesEnum } from '@/enums'
import { cn } from '@/utils'

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AddEmployeeDraft {
  role: AssignableCompanyRole | null
  salary: string
  secondaryWallet: string
  wallet: string
}

const initialAddEmployeeDraft: AddEmployeeDraft = {
  role: RolesEnum.Employee,
  salary: '',
  secondaryWallet: '',
  wallet: '',
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<AddEmployeeDraft>(initialAddEmployeeDraft)

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setStep(1)
      setDraft(initialAddEmployeeDraft)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(
          <Button className="primary-gradient text-on-primary-container px-6 py-6 rounded-sm text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 border-none">
            <PersonAddIcon className="size-5" />
            + Add Employee
          </Button>
        )}
      />

      <DialogContent className="max-w-xl p-0 overflow-hidden bg-surface-container border-white/10 shadow-[0_40px_80px_-15px_rgba(6,14,32,0.6)] rounded-lg gap-0">
        <div className="px-8 pt-8 pb-6 bg-surface-container-low/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">Add New Employee</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {step === 1 ? 'Step 1 of 2: Identity & Compensation' : 'Step 2 of 2: Confirm encrypted payload'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="grow h-1.5 rounded-full bg-primary-container relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <div className={cn(
              'grow h-1.5 rounded-full transition-colors',
              step === 2 ? 'bg-primary-container' : 'bg-surface-variant',
            )}
            />
          </div>
        </div>

        <form
          className="p-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (step === 1) {
              setStep(2)
              return
            }

            handleOpenChange(false)
          }}
        >
          {step === 1
            ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Employee Wallet Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FingerprintIcon className="size-4 text-tertiary" />
                      </div>
                      <Input
                        className="h-12 rounded-lg border-none bg-surface-container-lowest pl-11 pr-4 font-mono text-sm placeholder:text-outline/40 focus-visible:ring-tertiary/30"
                        placeholder="0x..."
                        value={draft.wallet}
                        onChange={event => setDraft(current => ({ ...current, wallet: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Internal Role</label>
                      <Select<AssignableCompanyRole>
                        items={ASSIGNABLE_COMPANY_ROLE_OPTIONS}
                        value={draft.role}
                        onValueChange={(role) => {
                          setDraft(current => ({ ...current, role }))
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-lg border-none bg-surface-container-lowest font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_COMPANY_ROLE_OPTIONS.map(role => (
                            <SelectItem key={role.value} value={role.value} role="button">
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly Salary (USDC)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockIcon className="size-4 text-tertiary fill-current" />
                        </div>
                        <Input
                          className="h-12 rounded-lg border-none bg-surface-container-lowest pl-11 pr-24 font-mono text-sm focus-visible:ring-tertiary/30"
                          placeholder="0.00"
                          type="number"
                          value={draft.salary}
                          onChange={event => setDraft(current => ({ ...current, salary: event.target.value }))}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-[9px] font-black text-tertiary/60 uppercase tracking-tighter">FHE ENCRYPTED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Secondary Receiving Wallet</span>
                      <span className="text-[9px] text-outline font-bold italic uppercase">Optional</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                        <AccountBalanceWalletIcon className="size-4" />
                      </div>
                      <Input
                        className="h-12 rounded-lg border-none bg-surface-container-lowest pl-11 pr-4 font-mono text-sm placeholder:text-outline/40"
                        placeholder="Alternate address..."
                        value={draft.secondaryWallet}
                        onChange={event => setDraft(current => ({ ...current, secondaryWallet: event.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )
            : (
                <div className="space-y-6">
                  <div className="rounded-lg border border-tertiary/15 bg-tertiary-container/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm bg-tertiary/15 text-tertiary">
                        <CheckCircleIcon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-sm font-bold text-on-surface">Review Employee Payload</h3>
                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                          Confirm the wallet, role and encrypted compensation details before submitting the invitation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg bg-surface-container-lowest p-4">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-outline">Employee Wallet Address</div>
                      <div className="break-all font-mono text-sm font-medium text-on-surface">{draft.wallet || 'Not provided'}</div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-surface-container-lowest p-4">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-outline">Internal Role</div>
                        <div className="text-sm font-bold text-on-surface">{ROLE_LABELS[draft.role!]}</div>
                      </div>
                      <div className="rounded-lg bg-surface-container-lowest p-4">
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-outline">
                          Monthly Salary
                          <LockIcon className="size-3 text-tertiary fill-current" />
                        </div>
                        <div className="font-mono text-sm font-bold text-tertiary">{draft.salary || '0.00'} USDC</div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-surface-container-lowest p-4">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-outline">Secondary Receiving Wallet</div>
                      <div className="break-all font-mono text-sm font-medium text-on-surface">
                        {draft.secondaryWallet || 'Use employee wallet'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/10 px-4 py-3">
                    <SecurityIcon className="size-4 shrink-0 text-tertiary fill-current" />
                    <span className="text-xs font-medium leading-5 text-on-surface-variant">
                      Salary value will be encrypted before it is stored or processed by payroll contracts.
                    </span>
                  </div>
                </div>
              )}

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            {step === 1
              ? (
                  <DialogClose
                    render={<Button variant="ghost" type="button" className="font-bold text-on-surface-variant hover:text-on-surface" />}
                  >
                    Cancel
                  </DialogClose>
                )
              : (
                  <Button
                    variant="ghost"
                    type="button"
                    className="font-bold text-on-surface-variant hover:text-on-surface"
                    onClick={() => setStep(1)}
                  >
                    <ArrowBackIcon className="size-4" />
                    Back
                  </Button>
                )}
            <Button
              type="submit"
              className="primary-gradient text-on-primary-container text-sm h-12 px-8 rounded-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2 border-none"
            >
              <span>{step === 1 ? 'Continue' : 'Confirm & Add'}</span>
              {step === 1 ? <ArrowForwardIcon className="size-4" /> : <CheckCircleIcon className="size-4" />}
            </Button>
          </div>
        </form>
        <div className="px-8 py-4 bg-surface-container-lowest/30 flex items-center justify-center gap-2 border-t border-white/5">
          <SecurityIcon className="size-3 text-tertiary fill-current" />
          <span className="text-[9px] tracking-[0.2em] text-outline uppercase font-mono font-black">Secured by Zama FHE Protocol</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
