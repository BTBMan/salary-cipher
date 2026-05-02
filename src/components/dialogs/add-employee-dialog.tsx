'use client'

import type { AssignableCompanyRole } from '@/constants'
import type { Address } from 'viem'
import { useMemo, useState } from 'react'
import {
  MdArrowBack as ArrowBackIcon,
  MdArrowForward as ArrowForwardIcon,
  MdCheckCircle as CheckCircleIcon,
  MdFingerprint as FingerprintIcon,
  MdLock as LockIcon,
  MdPersonAdd as PersonAddIcon,
  MdSecurity as SecurityIcon,
} from 'react-icons/md'
import { isAddress } from 'viem'
import { z } from 'zod'
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

export interface AddEmployeeSubmitInput {
  account: Address
  displayName: string
  monthlySalary: string
  role: AssignableCompanyRole
}

interface AddEmployeeDialogProps {
  canEncryptSalary: boolean
  initialValues?: Partial<AddEmployeeDraft>
  isSubmitting: boolean
  mode?: 'add' | 'edit'
  open: boolean
  salarySymbol: string
  showTrigger?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: AddEmployeeSubmitInput) => Promise<boolean>
}

interface AddEmployeeDraft {
  displayName: string
  role: AssignableCompanyRole
  salary: string
  wallet: string
}

type AddEmployeeFormErrors = Partial<Record<keyof AddEmployeeDraft, string>>

const SALARY_NUMBER_REGEX = /^\d+(\.\d+)?$/

const initialAddEmployeeDraft: AddEmployeeDraft = {
  displayName: '',
  role: RolesEnum.Employee,
  salary: '',
  wallet: '',
}

function getInitialEmployeeDraft(initialValues?: Partial<AddEmployeeDraft>) {
  return {
    ...initialAddEmployeeDraft,
    ...initialValues,
  }
}

const addEmployeeSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.').max(80, 'Display name is too long.'),
  role: z.union([z.literal(RolesEnum.HR), z.literal(RolesEnum.Employee)]),
  salary: z.string().trim().min(1, 'Monthly salary is required.').refine(value => SALARY_NUMBER_REGEX.test(value), 'Monthly salary must be a valid number.').refine((value) => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0
  }, 'Monthly salary must be greater than 0.'),
  wallet: z.string().trim().min(1, 'Wallet address is required.').refine(value => isAddress(value), 'Wallet address is invalid.'),
})

export function AddEmployeeDialog({
  canEncryptSalary,
  initialValues,
  isSubmitting,
  mode = 'add',
  open,
  salarySymbol,
  showTrigger = true,
  onOpenChange,
  onSubmit,
}: AddEmployeeDialogProps) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<AddEmployeeDraft>(() => getInitialEmployeeDraft(initialValues))
  const [formErrors, setFormErrors] = useState<AddEmployeeFormErrors>({})
  const isEditMode = mode === 'edit'

  const dialogDraft = useMemo(() => getInitialEmployeeDraft(initialValues), [initialValues])

  const updateDraft = <Field extends keyof AddEmployeeDraft>(field: Field, value: AddEmployeeDraft[Field]) => {
    setDraft(current => ({ ...current, [field]: value }))
    setFormErrors(current => ({ ...current, [field]: undefined }))
  }

  const resetDialog = () => {
    setStep(1)
    setDraft(dialogDraft)
    setFormErrors({})
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetDialog()
    }
  }

  const validateDraft = () => {
    const parsedForm = addEmployeeSchema.safeParse(draft)

    if (parsedForm.success) {
      setFormErrors({})
      return parsedForm.data
    }

    const nextErrors: AddEmployeeFormErrors = {}
    for (const issue of parsedForm.error.issues) {
      const fieldName = issue.path[0]
      if (typeof fieldName === 'string') {
        nextErrors[fieldName as keyof AddEmployeeDraft] = issue.message
      }
    }
    setFormErrors(nextErrors)
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger
          render={(
            <Button
              className="primary-gradient text-on-primary-container px-6 py-6 rounded-sm text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 border-none"
              disabled={!canEncryptSalary}
            >
              <PersonAddIcon className="size-5" />
              + Add Employee
            </Button>
          )}
        />
      )}

      <DialogContent className="max-w-xl p-0 overflow-hidden bg-surface-container border-white/10 shadow-[0_40px_80px_-15px_rgba(6,14,32,0.6)] rounded-lg gap-0">
        <div className="px-8 pt-8 pb-6 bg-surface-container-low/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
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
          onSubmit={async (event) => {
            event.preventDefault()

            const formValues = validateDraft()
            if (!formValues) {
              return
            }

            if (step === 1) {
              setStep(2)
              return
            }

            const submitted = await onSubmit({
              account: formValues.wallet as Address,
              displayName: formValues.displayName.trim(),
              monthlySalary: formValues.salary.trim(),
              role: formValues.role,
            })

            if (submitted) {
              handleOpenChange(false)
            }
          }}
        >
          {step === 1
            ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Display Name</label>
                    <Input
                      className="h-12 rounded-lg border-none bg-surface-container-lowest px-4 text-sm placeholder:text-outline/40 focus-visible:ring-tertiary/30"
                      placeholder="Alice Chen"
                      value={draft.displayName}
                      onChange={event => updateDraft('displayName', event.target.value)}
                    />
                    {formErrors.displayName && (
                      <p className="text-xs text-destructive">{formErrors.displayName}</p>
                    )}
                  </div>

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
                        disabled={isEditMode}
                        onChange={event => updateDraft('wallet', event.target.value)}
                      />
                    </div>
                    {formErrors.wallet && (
                      <p className="text-xs text-destructive">{formErrors.wallet}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Internal Role</label>
                      <Select<AssignableCompanyRole>
                        items={ASSIGNABLE_COMPANY_ROLE_OPTIONS}
                        value={draft.role}
                        onValueChange={(role) => {
                          if (role !== null) {
                            updateDraft('role', role)
                          }
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-lg border-none bg-surface-container-lowest font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_COMPANY_ROLE_OPTIONS.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Monthly Salary ({salarySymbol})
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockIcon className="size-4 text-tertiary fill-current" />
                        </div>
                        <Input
                          className="h-12 rounded-lg border-none bg-surface-container-lowest pl-11 pr-24 font-mono text-sm focus-visible:ring-tertiary/30"
                          min="0"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={draft.salary}
                          onChange={event => updateDraft('salary', event.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-[9px] font-black text-tertiary/60 uppercase tracking-tighter">FHE ENCRYPTED</span>
                        </div>
                      </div>
                      {formErrors.salary && (
                        <p className="text-xs text-destructive">{formErrors.salary}</p>
                      )}
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
                          Confirm the wallet, role and encrypted compensation details before submitting the {isEditMode ? 'update' : 'transaction'}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg bg-surface-container-lowest p-4">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-outline">Display Name</div>
                      <div className="text-sm font-bold text-on-surface">{draft.displayName || 'Not provided'}</div>
                    </div>

                    <div className="rounded-lg bg-surface-container-lowest p-4">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-outline">Employee Wallet Address</div>
                      <div className="break-all font-mono text-sm font-medium text-on-surface">{draft.wallet || 'Not provided'}</div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-surface-container-lowest p-4">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-outline">Internal Role</div>
                        <div className="text-sm font-bold text-on-surface">{ROLE_LABELS[draft.role]}</div>
                      </div>
                      <div className="rounded-lg bg-surface-container-lowest p-4">
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-outline">
                          Monthly Salary
                          <LockIcon className="size-3 text-tertiary fill-current" />
                        </div>
                        <div className="font-mono text-sm font-bold text-tertiary">{draft.salary || '0.00'} {salarySymbol}</div>
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
                    disabled={isSubmitting}
                    onClick={() => setStep(1)}
                  >
                    <ArrowBackIcon className="size-4" />
                    Back
                  </Button>
                )}
            <Button
              type="submit"
              className="primary-gradient text-on-primary-container text-sm h-12 px-8 rounded-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2 border-none"
              disabled={!canEncryptSalary || isSubmitting}
            >
              <span>{step === 1 ? 'Continue' : (isSubmitting ? 'Submitting...' : (isEditMode ? 'Confirm & Save' : 'Confirm & Add'))}</span>
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
