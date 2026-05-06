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
import { Input } from '@/components/ui/input'

interface DepositTreasuryDialogProps {
  amount: string
  error: string | null
  isDepositing: boolean
  onAmountChange: (amount: string) => void
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  ownerUnderlyingBalance: string
  tokenSymbol: string
}

export function DepositTreasuryDialog({
  amount,
  error,
  isDepositing,
  onAmountChange,
  onConfirm,
  onOpenChange,
  open,
  ownerUnderlyingBalance,
  tokenSymbol,
}: DepositTreasuryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
        <DialogHeader className="border-b border-white/5 px-6 py-5">
          <DialogTitle>Deposit treasury funds</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            This will approve {tokenSymbol}, deposit it into the company vault, then wrap it into the confidential settlement token.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Amount</label>
            <Input
              aria-invalid={Boolean(error)}
              className="h-12 rounded border-outline-variant/20 bg-surface-container-lowest px-4 font-mono text-sm font-medium text-on-surface shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
              inputMode="decimal"
              placeholder={`0.00 ${tokenSymbol}`}
              value={amount}
              onChange={event => onAmountChange(event.target.value)}
            />
            {error && <p className="text-xs font-bold text-destructive">{error}</p>}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Wallet balance: {ownerUnderlyingBalance} {tokenSymbol}
          </p>
        </div>
        <DialogFooter className="border-t border-white/5 px-6 py-5">
          <Button
            disabled={isDepositing}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="primary-gradient border-none text-on-primary-container"
            disabled={isDepositing}
            onClick={onConfirm}
          >
            {isDepositing && <AutorenewIcon className="size-4 animate-spin" />}
            Deposit &amp; Wrap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
