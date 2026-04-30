import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MdArrowBack as ArrowBackIcon,
  MdBusiness as BusinessIcon,
  MdInfoOutline as InfoIcon,
  MdLock as LockIcon,
  MdSavings as SavingsIcon,
  MdSync as SyncIcon,
} from 'react-icons/md'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils'

export const metadata: Metadata = {
  title: 'Salary Cipher | Create Company',
  description: 'Initialize a sovereign vault for a new company.',
}

export default function CreateCompanyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(128,131,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(183,109,255,0.1),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, rgba(144,143,160,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(144,143,160,0.4) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10 sm:px-6 sm:py-16">
        <Card className="w-full rounded-xl border border-outline-variant/20 bg-surface-container/72 py-0 shadow-[0_40px_120px_-48px_rgba(6,14,32,0.72)] backdrop-blur-xl">
          <CardHeader className="gap-5 border-b border-outline-variant/16 px-6 py-6 sm:px-8 sm:py-8">
            <Link
              href="/onboarding"
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <ArrowBackIcon className="size-4" />
              Back
            </Link>
            <div className="space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/12">
                <BusinessIcon className="size-7" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  Initialize Sovereign Vault
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Deploy a new company entity on-chain. This creates the vault used for payroll,
                  treasury and encrypted salary operations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
            <form className="space-y-8">
              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b border-outline-variant/16 pb-3">
                  <BusinessIcon className="size-5 text-primary" />
                  <h2 className="font-heading text-lg font-semibold text-on-surface">Entity Details</h2>
                </div>

                <div className="space-y-2">
                  <label htmlFor="company-name" className="text-sm font-medium text-on-surface">
                    Company Name
                  </label>
                  <Input
                    id="company-name"
                    placeholder="e.g. Acme Corp LLC"
                    className="h-12 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="company-description" className="text-sm font-medium text-on-surface">
                    Company Description
                  </label>
                  <Textarea
                    id="company-description"
                    placeholder="Briefly describe the purpose of this vault..."
                    className="min-h-28 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 py-3 shadow-none"
                  />
                </div>
              </section>

              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b border-outline-variant/16 pb-3">
                  <SavingsIcon className="size-5 text-tertiary" />
                  <h2 className="font-heading text-lg font-semibold text-on-surface">Financial Parameters</h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="primary-asset" className="text-sm font-medium text-on-surface">
                      Primary Disbursement Asset
                    </label>
                    <Select defaultValue="usdc">
                      <SelectTrigger
                        id="primary-asset"
                        className="h-12 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 shadow-none"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usdc">USDC (USD Coin)</SelectItem>
                        <SelectItem value="eth">ETH (Ethereum)</SelectItem>
                        <SelectItem value="dai">DAI (Dai Stablecoin)</SelectItem>
                        <SelectItem value="usdt">USDT (Tether)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="initial-deposit" className="flex items-center gap-2 text-sm font-medium text-on-surface">
                      Initial Liquidity Deposit
                      <LockIcon className="size-4 text-primary/75" />
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-on-surface-variant">
                        $
                      </span>
                      <Input
                        id="initial-deposit"
                        type="number"
                        placeholder="0.00"
                        className="h-12 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 pl-8 font-mono shadow-none"
                      />
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <InfoIcon className="size-3.5" />
                      Optional. Requested in the final signing step.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-outline-variant/16 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Link
                  href="/onboarding"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'justify-center rounded-lg px-6')}
                >
                  Cancel
                </Link>
                <Button size="lg" className="rounded-lg px-6">
                  <SyncIcon className="size-4 animate-spin" />
                  Create &amp; Sign
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
