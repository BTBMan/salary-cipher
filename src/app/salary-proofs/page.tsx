'use client'

import type { SalaryProofType } from '@/utils'
import { useMemo, useState } from 'react'
import {
  MdCheckCircle as CheckCircleIcon,
  MdContentCopy as ContentCopyIcon,
  MdImage as ImageIcon,
  MdKey as KeyIcon,
  MdLock as LockIcon,
  MdOpenInNew as OpenInNewIcon,
  MdRefresh as RefreshIcon,
  MdShield as ShieldIcon,
  MdUpload as UploadIcon,
  MdVerifiedUser as VerifiedUserIcon,
  MdWorkspacePremium as WorkspacePremiumIcon,
} from 'react-icons/md'
import { toast } from 'sonner'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useStoreContext } from '@/hooks'
import {
  buildSalaryProofMetadata,
  buildSalaryProofSvg,
  cn,
  getUnderlyingTokenSymbol,
  SALARY_PROOF_TYPES,
} from '@/utils'
import { uploadSalaryProofNft } from './actions'

type ProofStatus = 'valid' | 'expired' | 'revoked'

interface ProofRow {
  companyName: string
  condition: string
  createdAt: string
  expiresAt: string
  imageGatewayUrl?: string
  metadataGatewayUrl?: string
  nftStatus: 'not-minted' | 'minted'
  proofId: string
  proofType: SalaryProofType
  proofTypeLabel: string
  settlementToken: string
  status: ProofStatus
  svg: string
  tokenId?: string
  tokenUri?: string
}

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

const initialProofs: ProofRow[] = [
  {
    companyName: 'Acme Corp',
    condition: 'Monthly salary >= threshold',
    createdAt: 'Design sample',
    expiresAt: '2026-07-06',
    nftStatus: 'minted',
    proofId: '#0001',
    proofType: 'MONTHLY_GTE',
    proofTypeLabel: 'Monthly Salary >= X',
    settlementToken: 'USDC',
    status: 'valid',
    svg: buildSalaryProofSvg({
      companyName: 'Acme Corp',
      expiresAt: '2026-07-06',
      proofId: '#0001',
      proofTypeLabel: 'Monthly Salary >= X',
      settlementToken: 'USDC',
    }),
    tokenId: '#12',
    tokenUri: 'ipfs://metadata-cid-after-pinata-upload',
  },
]

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

function getProofCondition(proofType: SalaryProofType, minAmount: string, maxAmount: string, months: string, tokenSymbol: string) {
  switch (proofType) {
    case 'MONTHLY_GTE':
      return `Monthly salary >= ${minAmount} ${tokenSymbol}`
    case 'MONTHLY_BETWEEN':
      return `Monthly salary between ${minAmount} and ${maxAmount} ${tokenSymbol}`
    case 'EMPLOYMENT_DURATION_GTE':
      return `Employment duration >= ${months} months`
  }
}

export default function SalaryProofsPage() {
  const { selectedCompany, settlementAssets } = useStoreContext()
  const [proofType, setProofType] = useState<SalaryProofType>('MONTHLY_GTE')
  const [minAmount, setMinAmount] = useState('5000')
  const [maxAmount, setMaxAmount] = useState('8000')
  const [months, setMonths] = useState('12')
  const [validityDays, setValidityDays] = useState<'7' | '30' | '90'>('30')
  const [formError, setFormError] = useState<string | null>(null)
  const [proofs, setProofs] = useState<ProofRow[]>(initialProofs)
  const [selectedProof, setSelectedProof] = useState<ProofRow | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [mintingProofId, setMintingProofId] = useState<string | null>(null)
  const [mintStep, setMintStep] = useState<string | null>(null)

  const selectedAsset = useMemo(() => {
    if (!selectedCompany) {
      return null
    }

    return settlementAssets.find(asset => asset.value === selectedCompany.settlementAsset) ?? null
  }, [selectedCompany, settlementAssets])
  const settlementTokenSymbol = getUnderlyingTokenSymbol(selectedAsset)
  const selectedProofType = SALARY_PROOF_TYPES.find(item => item.value === proofType) ?? SALARY_PROOF_TYPES[0]
  const activeProofs = proofs.filter(proof => proof.status === 'valid').length
  const mintedProofs = proofs.filter(proof => proof.nftStatus === 'minted').length

  const handleGenerateProof = () => {
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
    const createdAt = new Date()
    const expiresAt = new Date(createdAt)
    expiresAt.setDate(createdAt.getDate() + Number(validityDays))
    const proofId = `#${String(proofs.length + 1).padStart(4, '0')}`
    const condition = getProofCondition(proofType, minAmount, maxAmount, months, settlementTokenSymbol)
    const proofTypeLabel = selectedProofType.label
    const svg = buildSalaryProofSvg({
      companyName: selectedCompany?.name ?? 'Selected Company',
      expiresAt: formatDate(expiresAt),
      proofId,
      proofTypeLabel,
      settlementToken: settlementTokenSymbol,
    })

    const nextProof: ProofRow = {
      companyName: selectedCompany?.name ?? 'Selected Company',
      condition,
      createdAt: formatDate(createdAt),
      expiresAt: formatDate(expiresAt),
      nftStatus: 'not-minted',
      proofId,
      proofType,
      proofTypeLabel,
      settlementToken: settlementTokenSymbol,
      status: 'valid',
      svg,
    }

    setProofs(current => [nextProof, ...current])
    setSelectedProof(nextProof)
    setIsPreviewOpen(true)
    toast.success('Salary proof draft generated.')
  }

  const handleMintProof = async (proof: ProofRow) => {
    if (proof.nftStatus === 'minted') {
      setSelectedProof(proof)
      setIsPreviewOpen(true)
      return
    }

    setMintingProofId(proof.proofId)
    try {
      setMintStep('Generating NFT image...')
      const metadataWithoutImage = buildSalaryProofMetadata({
        companyName: proof.companyName,
        expiresAt: proof.expiresAt,
        imageUri: 'ipfs://pending-image-upload',
        proofId: proof.proofId,
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
        proofId: proof.proofId,
        svg: proof.svg,
      })

      setMintStep('Preparing RWA NFT preview...')
      const updatedProof: ProofRow = {
        ...proof,
        imageGatewayUrl: upload.imageGatewayUrl,
        metadataGatewayUrl: upload.metadataGatewayUrl,
        nftStatus: 'minted',
        tokenId: `#${String(Date.now()).slice(-5)}`,
        tokenUri: upload.tokenUri,
      }

      setProofs(current => current.map(item => (item.proofId === proof.proofId ? updatedProof : item)))
      setSelectedProof(updatedProof)
      setIsPreviewOpen(true)
      toast.success('RWA NFT metadata uploaded to Pinata.')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload NFT metadata.'
      toast.error(message)
    }
    finally {
      setMintStep(null)
      setMintingProofId(null)
    }
  }

  const handleCopyProofLink = async (proof: ProofRow) => {
    await navigator.clipboard.writeText(`${window.location.origin}/salary-proofs/${proof.proofId.replace('#', '')}`)
    toast.success('Proof link copied.')
  }

  const handleRevokeProof = (proof: ProofRow) => {
    setProofs(current => current.map(item => (item.proofId === proof.proofId ? { ...item, status: 'revoked' } : item)))
    toast.success('Proof marked as revoked.')
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface-container-low p-8 shadow-2xl">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-28 left-24 size-72 rounded-full bg-tertiary/15 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2">
                <WorkspacePremiumIcon className="size-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Employee-controlled RWA credential</span>
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-black tracking-tight text-on-surface">Salary Proofs</h1>
                <p className="text-sm font-medium leading-7 text-on-surface-variant">
                  Generate privacy-preserving income proofs for rentals, mortgage checks, credit facilities, or DeFi integrations. Owner does not have access to this page.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
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
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <Card className="xl:col-span-5 rounded-xl border border-white/5 bg-surface-container-low p-0 shadow-2xl">
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
                onClick={handleGenerateProof}
              >
                <KeyIcon className="size-5" />
                Generate Proof Draft
              </Button>
            </CardContent>
          </Card>

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
                    <TableHead>NFT</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proofs.map(proof => (
                    <TableRow key={proof.proofId}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-primary">{proof.proofId}</span>
                            <span className="font-heading text-sm font-black text-on-surface">{proof.proofTypeLabel}</span>
                          </div>
                          <p className="mt-1 max-w-72 truncate text-xs font-medium text-on-surface-variant">{proof.condition}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-on-surface-variant">{proof.createdAt}</TableCell>
                      <TableCell>
                        <Badge className={cn('rounded-full px-3', getStatusClassName(proof.status))}>{getStatusLabel(proof.status)}</Badge>
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
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest" onClick={() => void handleCopyProofLink(proof)}>
                            <ContentCopyIcon className="size-3.5" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest" onClick={() => handleRevokeProof(proof)} disabled={proof.status === 'revoked'}>
                            Revoke
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-sm px-3 text-[10px] font-black uppercase tracking-widest"
                            disabled={mintingProofId === proof.proofId || proof.status !== 'valid'}
                            onClick={() => void handleMintProof(proof)}
                          >
                            {mintingProofId === proof.proofId ? <RefreshIcon className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                            {proof.nftStatus === 'minted' ? 'View NFT' : 'Mint'}
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

        <Card className="rounded-xl border border-tertiary/15 bg-tertiary/5 p-0">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tertiary/10">
                <UploadIcon className="size-6 text-tertiary" />
              </div>
              <div>
                <h3 className="font-heading text-base font-black text-on-surface">Pinata IPFS upload</h3>
                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-on-surface-variant">
                  Mint flow currently generates the SVG credential, uploads it to Pinata, writes the SVG URI into metadata, then uploads metadata. The final on-chain NFT mint waits for SalaryProof and ProofNFT contracts to be implemented.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
          <DialogHeader className="border-b border-white/5 px-6 py-5">
            <DialogTitle>RWA Salary Proof NFT</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              SVG preview does not reveal the salary amount or decrypted proof result.
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
              <div className="bg-surface-container-lowest p-6">
                <img
                  alt={`${selectedProof.proofId} RWA salary proof NFT preview`}
                  className="block h-auto w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl"
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(selectedProof.svg)}`}
                />
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Proof ID</p>
                  <p className="mt-1 font-mono text-lg font-black text-on-surface">{selectedProof.proofId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Type</p>
                    <p className="mt-2 text-sm font-bold text-on-surface">{selectedProof.proofTypeLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Token</p>
                    <p className="mt-2 text-sm font-bold text-on-surface">{selectedProof.settlementToken}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Expires</p>
                    <p className="mt-2 text-sm font-bold text-on-surface">{selectedProof.expiresAt}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">NFT</p>
                    <p className="mt-2 text-sm font-bold text-on-surface">{selectedProof.tokenId ?? 'Not minted'}</p>
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

                {selectedProof.metadataGatewayUrl && (
                  <a
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
                    href={selectedProof.metadataGatewayUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View IPFS metadata
                    <OpenInNewIcon className="size-4" />
                  </a>
                )}

                {mintStep && selectedProof.proofId === mintingProofId && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
                    <RefreshIcon className="size-4 animate-spin" />
                    {mintStep}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-white/5 px-6 py-5">
            {selectedProof && (
              <Button
                className="rounded-sm"
                disabled={mintingProofId === selectedProof.proofId || selectedProof.status !== 'valid'}
                onClick={() => void handleMintProof(selectedProof)}
              >
                {selectedProof.nftStatus === 'minted' ? <CheckCircleIcon className="size-4" /> : <WorkspacePremiumIcon className="size-4" />}
                {selectedProof.nftStatus === 'minted' ? 'NFT Ready' : 'Mint as NFT'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
