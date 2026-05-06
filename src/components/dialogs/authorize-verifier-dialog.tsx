'use client'

import type { SalaryProofRow } from '@/hooks'
import {
  MdRefresh as RefreshIcon,
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

interface AuthorizeVerifierDialogProps {
  onAuthorize: () => void
  onOpenChange: (open: boolean) => void
  onVerifierAddressChange: (value: string) => void
  pendingAction: string | null
  proof: SalaryProofRow | null
  verifierAddress: string
}

export function AuthorizeVerifierDialog({
  onAuthorize,
  onOpenChange,
  onVerifierAddressChange,
  pendingAction,
  proof,
  verifierAddress,
}: AuthorizeVerifierDialogProps) {
  return (
    <Dialog open={Boolean(proof)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-white/10 bg-surface-container">
        <DialogHeader>
          <DialogTitle>Authorize Verifier</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            The verifier will be able to decrypt this proof result, but not your salary amount.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Verifier Address</label>
          <Input
            className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-mono text-xs font-bold shadow-inner focus-visible:ring-tertiary/30"
            onChange={event => onVerifierAddressChange(event.target.value)}
            placeholder="0x..."
            value={verifierAddress}
          />
        </div>
        <DialogFooter>
          <Button
            className="rounded-sm"
            disabled={!proof || pendingAction === `authorize:${proof.proofId.toString()}`}
            onClick={onAuthorize}
          >
            {proof && pendingAction === `authorize:${proof.proofId.toString()}` && <RefreshIcon className="size-4 animate-spin" />}
            Authorize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
