'use client'

import type { SalaryProofRow } from '@/hooks'
import type { SalaryProofType } from '@/utils'
import { useState } from 'react'
import {
  MdContentCopy as ContentCopyIcon,
  MdImage as ImageIcon,
  MdKey as KeyIcon,
  MdLock as LockIcon,
  MdRefresh as RefreshIcon,
  MdVerifiedUser as VerifiedUserIcon,
  MdWorkspacePremium as WorkspacePremiumIcon,
} from 'react-icons/md'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthorizeVerifierDialog } from '@/components/dialogs/authorize-verifier-dialog'
import { SalaryProofNftDialog } from '@/components/dialogs/salary-proof-nft-dialog'
import { EncryptedField } from '@/components/encrypted-field'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSalaryProofs, useStoreContext } from '@/hooks'
import {
  buildSalaryProofMetadata,
  buildSalaryProofSvg,
  cn,
  SALARY_PROOF_TYPES,
} from '@/utils'
import { uploadSalaryProofNft } from './actions'

type ProofStatus = 'valid' | 'expired' | 'revoked'

const amountRegex = /^\d+(\.\d+)?$/

const proofFormSchema = z.object({
  maxAmount: z.string().trim().optional(),
  minAmount: z.string().trim().optional(),
  months: z.string().trim().optional(),
  proofType: z.enum(['MONTHLY_GTE', 'MONTHLY_BETWEEN', 'EMPLOYMENT_DURATION_GTE']),
  validityDays: z.enum(['7', '30', '90']),
}).superRefine((value, ctx) => {
  if (value.proofType === 'MONTHLY_GTE') {
    if (!value.minAmount || !amountRegex.test(value.minAmount) || Number(value.minAmount) <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid threshold amount.',
        path: ['minAmount'],
      })
    }
  }

  if (value.proofType === 'MONTHLY_BETWEEN') {
    const min = Number(value.minAmount)
    const max = Number(value.maxAmount)
    if (!value.minAmount || !value.maxAmount || !amountRegex.test(value.minAmount) || !amountRegex.test(value.maxAmount) || min <= 0 || max <= min) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid salary range.',
        path: ['maxAmount'],
      })
    }
  }

  if (value.proofType === 'EMPLOYMENT_DURATION_GTE') {
    const months = Number(value.months)
    if (!value.months || !Number.isInteger(months) || months <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid employment duration.',
        path: ['months'],
      })
    }
  }
})

function getStatusLabel(status: ProofStatus) {
  switch (status) {
    case 'valid':
      return 'Valid'
    case 'expired':
      return 'Expired'
    case 'revoked':
      return 'Revoked'
  }
}

function getStatusClassName(status: ProofStatus) {
  switch (status) {
    case 'valid':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    case 'expired':
      return 'border-outline/20 bg-outline/10 text-outline'
    case 'revoked':
      return 'border-destructive/20 bg-destructive/10 text-destructive'
  }
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

export default function SalaryProofsPage() {
  const { selectedCompany } = useStoreContext()
  const {
    authorizeVerifier,
    decryptProofResult,
    generateProof,
    isDecryptingProofResult,
    mintProofNFT,
    pendingAction,
    revokeProof,
    rows: proofs,
    salaryProofAddress,
  } = useSalaryProofs(selectedCompany)
  const [proofType, setProofType] = useState<SalaryProofType>('MONTHLY_GTE')
  const [minAmount, setMinAmount] = useState('5000')
  const [maxAmount, setMaxAmount] = useState('8000')
  const [months, setMonths] = useState('12')
  const [validityDays, setValidityDays] = useState<'7' | '30' | '90'>('30')
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedProof, setSelectedProof] = useState<SalaryProofRow | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [mintStep, setMintStep] = useState<string | null>(null)
  const [authorizingProof, setAuthorizingProof] = useState<SalaryProofRow | null>(null)
  const [verifierAddress, setVerifierAddress] = useState('')

  const selectedProofType = SALARY_PROOF_TYPES.find(item => item.value === proofType) ?? SALARY_PROOF_TYPES[0]
  const activeProofs = proofs.filter(proof => proof.status === 'valid').length
  const mintedProofs = proofs.filter(proof => proof.nftStatus === 'minted').length

  const buildProofSvg = (proof: SalaryProofRow) => {
    const proofId = formatProofId(proof.proofId)

    return buildSalaryProofSvg({
      companyName: proof.companyName,
      expiresAt: formatTimestamp(proof.expiresAt),
      proofId,
      proofTypeLabel: proof.proofTypeLabel,
      settlementToken: proof.settlementToken,
    })
  }

  const handleGenerateProof = async () => {
    const result = proofFormSchema.safeParse({
      maxAmount,
      minAmount,
      months,
      proofType,
      validityDays,
    })

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Invalid proof input.')
      return
    }

    setFormError(null)
    await generateProof({
      maxAmount,
      minAmount,
      months,
      proofType,
      validityDays: Number(validityDays),
    })
  }

  const handleMintProof = async (proof: SalaryProofRow) => {
    if (proof.nftStatus === 'minted') {
      setSelectedProof(proof)
      setIsPreviewOpen(true)
      return
    }

    const svg = buildProofSvg(proof)

    try {
      setMintStep('Generating NFT image...')
      const metadataWithoutImage = buildSalaryProofMetadata({
        companyName: proof.companyName,
        expiresAt: formatTimestamp(proof.expiresAt),
        imageUri: 'ipfs://pending-image-upload',
        proofId: formatProofId(proof.proofId),
        proofTypeLabel: proof.proofTypeLabel,
        settlementToken: proof.settlementToken,
      })
      const metadata = {
        attributes: metadataWithoutImage.attributes,
        description: metadataWithoutImage.description,
        external_url: metadataWithoutImage.external_url,
        name: metadataWithoutImage.name,
      }

      setMintStep('Uploading image and metadata to IPFS...')
      const upload = await uploadSalaryProofNft({
        metadata,
        proofId: formatProofId(proof.proofId),
        svg,
      })

      setMintStep('Minting NFT on-chain...')
      const minted = await mintProofNFT(proof.proofId, upload.tokenUri)
      if (!minted) {
        return
      }

      const updatedProof: SalaryProofRow = {
        ...proof,
        nftStatus: 'minted',
      }

      setSelectedProof(updatedProof)
      toast.success('NFT minted successfully.')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload NFT metadata.'
      toast.error(message)
    }
    finally {
      setMintStep(null)
    }
  }

  const handleCopyProofLink = async (proof: SalaryProofRow) => {
    await navigator.clipboard.writeText(`${window.location.origin}/salary-proofs/${proof.proofId.toString()}`)
    toast.success('Proof link copied.')
  }

  const handleAuthorizeVerifier = async () => {
    if (!authorizingProof) {
      return
    }

    const authorized = await authorizeVerifier(authorizingProof.proofId, verifierAddress)
    if (authorized) {
      setAuthorizingProof(null)
      setVerifierAddress('')
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl relative overflow-hidden">
            <CardContent className="space-y-7 p-8 h-full">
              <div className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-28 left-24 size-72 rounded-full bg-tertiary/15 blur-3xl" />
              <div className="relative z-10 h-full flex flex-col gap-6 lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center gap-2">
                    <WorkspacePremiumIcon className="size-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Employee-controlled RWA credential</span>
                  </div>
                  <div className="space-y-3">
                    <h1 className="font-heading text-4xl font-black tracking-tight text-on-surface">Salary Proofs</h1>
                    <p className="text-sm font-medium leading-7 text-on-surface-variant">
                      Generate privacy-preserving income proofs for rentals, mortgage checks, credit facilities, or DeFi integrations.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-72">
                  <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Active</p>
                    <p className="mt-2 font-heading text-2xl font-black text-on-surface">{activeProofs}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">RWA NFTs</p>
                    <p className="mt-2 font-heading text-2xl font-black text-on-surface">{mintedProofs}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
            <CardContent className="space-y-7 p-8">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-secondary-container">
                  <VerifiedUserIcon className="size-7 text-on-secondary-container" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-black text-on-surface">Generate Proof</h2>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">Three proof types are fixed for the current contract design.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Proof Type</label>
                  <Select value={proofType} onValueChange={value => setProofType(value as SalaryProofType)}>
                    <SelectTrigger className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-bold shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_PROOF_TYPES.map(item => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs font-medium leading-5 text-outline">{selectedProofType.description}</p>
                </div>

                {proofType === 'MONTHLY_GTE' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Threshold</label>
                    <Input
                      className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-mono font-bold shadow-inner focus-visible:ring-tertiary/30"
                      onChange={event => setMinAmount(event.target.value)}
                      value={minAmount}
                    />
                  </div>
                )}

                {proofType === 'MONTHLY_BETWEEN' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Min</label>
                      <Input
                        className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-mono font-bold shadow-inner focus-visible:ring-tertiary/30"
                        onChange={event => setMinAmount(event.target.value)}
                        value={minAmount}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Max</label>
                      <Input
                        className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-mono font-bold shadow-inner focus-visible:ring-tertiary/30"
                        onChange={event => setMaxAmount(event.target.value)}
                        value={maxAmount}
                      />
                    </div>
                  </div>
                )}

                {proofType === 'EMPLOYMENT_DURATION_GTE' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Minimum Months</label>
                    <Input
                      className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-mono font-bold shadow-inner focus-visible:ring-tertiary/30"
                      onChange={event => setMonths(event.target.value)}
                      value={months}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Validity</label>
                  <Select value={validityDays} onValueChange={value => setValidityDays(value as '7' | '30' | '90')}>
                    <SelectTrigger className="h-12 rounded-lg border-none bg-surface-container-lowest px-5 font-bold shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive">
                  {formError}
                </div>
              )}

              <Button
                className="h-12 w-full rounded-sm border-none text-sm shadow-xl shadow-primary/20 vault-gradient text-on-primary-container"
                disabled={pendingAction === 'generate' || !salaryProofAddress}
                onClick={() => void handleGenerateProof()}
              >
                {pendingAction === 'generate' ? <RefreshIcon className="size-5 animate-spin" /> : <KeyIcon className="size-5" />}
                {pendingAction === 'generate' ? 'Generating Proof...' : 'Generate On-chain Proof'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-7 overflow-hidden rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-white/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-black text-on-surface">Proof History</h2>
                <p className="mt-1 text-xs font-medium text-on-surface-variant">Only your personal proof records are shown.</p>
              </div>
              <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 text-primary">
                <LockIcon className="size-3" />
                Private by default
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proof</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>NFT</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proofs.length === 0 && (
                  <TableRow>
                    <TableCell className="py-8 text-center text-sm font-medium text-on-surface-variant" colSpan={6}>
                      No on-chain salary proofs yet.
                    </TableCell>
                  </TableRow>
                )}
                {proofs.map(proof => (
                  <TableRow key={proof.proofId.toString()}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-primary">{formatProofId(proof.proofId)}</span>
                          <span className="font-heading text-sm font-black text-on-surface">{proof.proofTypeLabel}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger render={<p className="mt-1 max-w-72 truncate text-xs font-medium text-on-surface-variant">{proof.condition}</p>} />
                          <TooltipContent>
                            {proof.condition}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-on-surface-variant">{formatTimestamp(proof.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full px-3', getStatusClassName(proof.status))}>{getStatusLabel(proof.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {proof.proofResultHandle
                        ? (
                            <EncryptedField
                              className="max-w-30"
                              canDecrypt={Boolean(salaryProofAddress)}
                              isDecrypting={salaryProofAddress
                                ? isDecryptingProofResult({
                                    contractAddress: salaryProofAddress,
                                    handle: proof.proofResultHandle,
                                  })
                                : false}
                              isEncrypted={proof.proofResult === null}
                              onDecrypt={salaryProofAddress
                                ? () => decryptProofResult({
                                    contractAddress: salaryProofAddress,
                                    handle: proof.proofResultHandle!,
                                  })
                                : undefined}
                              value={proof.proofResult === null ? proof.proofResultHandle : proof.proofResult ? 'Passed' : 'Not passed'}
                            />
                          )
                        : <span className="text-xs font-bold text-outline">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'rounded-full px-3',
                        proof.nftStatus === 'minted'
                          ? 'border-tertiary/20 bg-tertiary/10 text-tertiary'
                          : 'border-outline/20 bg-outline/10 text-outline',
                      )}
                      >
                        {proof.nftStatus === 'minted' ? 'Minted' : 'Not minted'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => handleCopyProofLink(proof)}
                        >
                          <ContentCopyIcon className="size-3.5" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => setAuthorizingProof(proof)}
                          disabled={proof.status !== 'valid'}
                        >
                          Authorize
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => revokeProof(proof.proofId)}
                          disabled={proof.status === 'revoked' || pendingAction === `revoke:${proof.proofId.toString()}`}
                        >
                          Revoke
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest"
                          disabled={pendingAction === `mint:${proof.proofId.toString()}` || proof.status !== 'valid'}
                          onClick={() => handleMintProof(proof)}
                        >
                          {pendingAction === `mint:${proof.proofId.toString()}` ? <RefreshIcon className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                          {proof.nftStatus === 'minted' ? 'View' : 'Mint'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SalaryProofNftDialog
        mintStep={mintStep}
        open={isPreviewOpen}
        pendingAction={pendingAction}
        proof={selectedProof}
        onMint={proof => void handleMintProof(proof)}
        onOpenChange={setIsPreviewOpen}
      />

      <AuthorizeVerifierDialog
        pendingAction={pendingAction}
        proof={authorizingProof}
        verifierAddress={verifierAddress}
        onAuthorize={() => void handleAuthorizeVerifier()}
        onOpenChange={(open) => {
          if (!open) {
            setAuthorizingProof(null)
            setVerifierAddress('')
          }
        }}
        onVerifierAddressChange={setVerifierAddress}
      />
    </AppLayout>
  )
}
