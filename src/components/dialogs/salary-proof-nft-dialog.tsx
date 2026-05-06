'use client'

import type { SalaryProofRow } from '@/hooks'
import {
  MdCheckCircle as CheckCircleIcon,
  MdOpenInNew as OpenInNewIcon,
  MdRefresh as RefreshIcon,
  MdShield as ShieldIcon,
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatTimestamp(timestamp: number) {
  return timestamp ? formatDate(new Date(timestamp * 1000)) : '-'
}

function formatProofId(proofId: bigint) {
  return `#${proofId.toString().padStart(4, '0')}`
}

export function SalaryProofNftDialog({
  mintStep,
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
            NFT image is loaded from on-chain tokenURI metadata only. Salary amount and decrypted proof result stay out of IPFS.
          </DialogDescription>
        </DialogHeader>

        {proof && (
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="bg-surface-container-lowest p-6">
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

            <div className="space-y-5 p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Proof ID</p>
                <p className="mt-1 font-mono text-lg font-black text-on-surface">{formatProofId(proof.proofId)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Type</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{proof.proofTypeLabel}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Token</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{proof.settlementToken}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Expires</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{formatTimestamp(proof.expiresAt)}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">NFT</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{proof.tokenId ? `#${proof.tokenId.toString()}` : 'Not minted'}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="size-4 text-primary" />
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Privacy boundary</p>
                </div>
                <p className="text-sm font-medium leading-6 text-on-surface-variant">
                  The NFT image and metadata include proof summary only. Salary amount, employee name, and decrypted result stay out of IPFS.
                </p>
              </div>

              {proof.nftMetadataGatewayUrl && (
                <a
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
                  href={proof.nftMetadataGatewayUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  View IPFS metadata
                  <OpenInNewIcon className="size-4" />
                </a>
              )}

              {mintStep && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
                  <RefreshIcon className="size-4 animate-spin" />
                  {mintStep}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-white/5 px-6 py-5">
          {proof && (
            <Button
              className="rounded-sm"
              disabled={pendingAction === `mint:${proof.proofId.toString()}` || proof.status !== 'valid'}
              onClick={() => onMint(proof)}
            >
              {proof.nftStatus === 'minted' ? <CheckCircleIcon className="size-4" /> : <WorkspacePremiumIcon className="size-4" />}
              {proof.nftStatus === 'minted' ? 'NFT Ready' : 'Mint as NFT'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
