'use client'

import {
  MdAutorenew as AutorenewIcon,
} from 'react-icons/md'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ExecutePayrollDialogProps {
  isEarlyPayroll: boolean
  isExecuting: boolean
  nextPayrollDate: string | null | undefined
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function ExecutePayrollDialog({
  isEarlyPayroll,
  isExecuting,
  nextPayrollDate,
  onConfirm,
  onOpenChange,
  open,
}: ExecutePayrollDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
        <DialogHeader className="border-b border-white/5 px-6 py-5">
          <DialogTitle>Execute payroll now</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            {isEarlyPayroll
              ? `The next scheduled payday is ${nextPayrollDate ?? 'not available'}, which is more than one day away. Executing now will pay the next unpaid payroll cycle early and move the next payday forward.`
              : 'This will execute the current unpaid payroll cycle for all eligible employees.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-white/5 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Current next payday</p>
            <p className="mt-2 font-mono text-lg font-black text-on-surface">{nextPayrollDate ?? '-'}</p>
          </div>
          <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
            Payroll transfers are confidential token transfers. The amount remains encrypted, but recipient addresses and execution events are visible on-chain.
          </p>
        </div>
        <DialogFooter className="border-t border-white/5 px-6 py-5">
          <Button
            disabled={isExecuting}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="primary-gradient border-none text-on-primary-container"
            disabled={isExecuting}
            onClick={onConfirm}
          >
            {isExecuting && <AutorenewIcon className="size-4 animate-spin" />}
            Confirm Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
