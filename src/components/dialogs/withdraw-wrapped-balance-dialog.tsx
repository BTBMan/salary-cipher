'use client'

import {
  MdAutorenew as AutorenewIcon,
} from 'react-icons/md'
import { EncryptedField } from '@/components/encrypted-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WithdrawWrappedBalanceDialogProps {
  canDecryptVaultBalance: boolean
  confidentialTokenSymbol: string
  isDecryptingVaultBalance: boolean
  isWithdrawingWrapped: boolean
  onDecryptVaultBalance: () => void
  onOpenChange: (open: boolean) => void
  onWithdraw: () => void
  open: boolean
  vaultBalanceLabel: string
  vaultConfidentialBalance: string | null
}

export function WithdrawWrappedBalanceDialog({
  canDecryptVaultBalance,
  confidentialTokenSymbol,
  isDecryptingVaultBalance,
  isWithdrawingWrapped,
  onDecryptVaultBalance,
  onOpenChange,
  onWithdraw,
  open,
  vaultBalanceLabel,
  vaultConfidentialBalance,
}: WithdrawWrappedBalanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
        <DialogHeader className="border-b border-white/5 px-6 py-5">
          <DialogTitle>Withdraw wrapped treasury balance</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            This unwraps the vault&apos;s full confidential balance and returns the underlying token to the company owner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-white/5 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Wrapped balance</p>
            <div className="mt-2 flex items-center gap-2">
              <EncryptedField
                canDecrypt={canDecryptVaultBalance}
                className="space-y-0"
                isDecrypting={isDecryptingVaultBalance}
                isEncrypted={!vaultConfidentialBalance}
                value={vaultBalanceLabel}
                valueClassName="font-mono text-lg font-black text-on-surface"
                onDecrypt={onDecryptVaultBalance}
              />
              <span className="font-mono text-lg font-black text-on-surface">{confidentialTokenSymbol}</span>
            </div>
          </div>
          <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
            This flow submits the unwrap request, decrypts the public unwrap amount, then finalizes the underlying token transfer.
          </p>
        </div>
        <DialogFooter className="border-t border-white/5 px-6 py-5">
          <Button
            disabled={isWithdrawingWrapped}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="primary-gradient border-none text-on-primary-container"
            disabled={isWithdrawingWrapped}
            onClick={onWithdraw}
          >
            {isWithdrawingWrapped && <AutorenewIcon className="size-4 animate-spin" />}
            Confirm Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
