'use client'

import type { SalaryProofRow } from '@/hooks'
import {
  // MdCheckCircle as CheckCircleIcon,
  // MdOpenInNew as OpenInNewIcon,
  // MdRefresh as RefreshIcon,
  // MdShield as ShieldIcon,
  MdWorkspacePremium as WorkspacePremiumIcon,
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

interface SalaryProofNftDialogProps {
  mintStep: string | null
  onMint: (proof: SalaryProofRow) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  pendingAction: string | null
  proof: SalaryProofRow | null
}

// function formatDate(date: Date) {
//   return new Intl.DateTimeFormat('en-US', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   }).format(date)
// }

// function formatTimestamp(timestamp: number) {
//   return timestamp ? formatDate(new Date(timestamp * 1000)) : '-'
// }

// function formatProofId(proofId: bigint) {
//   return `#${proofId.toString().padStart(4, '0')}`
// }

export function SalaryProofNftDialog({
  // mintStep,
  onMint,
  onOpenChange,
  open,
  pendingAction,
  proof,
}: SalaryProofNftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
        <DialogHeader className="border-b border-white/5 px-6 py-5">
          <DialogTitle>RWA Salary Proof NFT</DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            NFT image is loaded from on-chain tokenURI metadata only.
          </DialogDescription>
        </DialogHeader>

        {proof && (
          <div>
            <div className="bg-surface-container-lowest p-6 min-h-100">
              {proof.nftImageGatewayUrl
                ? (
                    <img
                      alt={`${proof.proofId} RWA salary proof NFT preview`}
                      className="block h-auto w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl"
                      src={proof.nftImageGatewayUrl}
                    />
                  )
                : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-white/10 bg-black p-6 text-center text-xs font-bold uppercase tracking-widest text-outline shadow-2xl">
                      NFT image is only shown after it is loaded from the on-chain tokenURI metadata.
                    </div>
                  )}
            </div>
          </div>
        )}

        {proof && proof.nftStatus !== 'minted' && (
          <DialogFooter className="border-t border-white/5 px-6 py-5">
            <Button
              className="rounded-sm"
              disabled={pendingAction === `mint:${proof.proofId.toString()}` || proof.status !== 'valid'}
              onClick={() => onMint(proof)}
            >
              <WorkspacePremiumIcon className="size-4" />
              Mint as NFT
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
