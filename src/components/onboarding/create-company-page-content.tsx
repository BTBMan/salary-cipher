'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  MdArrowBack as ArrowBackIcon,
  MdBusiness as BusinessIcon,
  MdCalendarMonth as CalendarIcon,
  MdInfoOutline as InfoIcon,
  MdOutlineAccountBalance,
  MdOutlineRefresh,
} from 'react-icons/md'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea'
import { SettlementAssetEnum } from '@/enums'
import { useStoreContext } from '@/hooks'
import { cn } from '@/utils'

const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required.').max(100, 'Company name is too long.'),
  // description: z.string().trim(),
  payrollDayOfMonth: z.coerce.number().int().min(1, 'Payroll day must be between 1 and 28.').max(28, 'Payroll day must be between 1 and 28.'),
  settlementAsset: z.number().int().refine(
    value => value === SettlementAssetEnum.USDC || value === SettlementAssetEnum.USDT,
    'Select a settlement asset.',
  ) as z.ZodType<SettlementAssetEnum>,
})

interface CreateCompanyFormValues {
  name: string
  // description: string
  payrollDayOfMonth: number
  settlementAsset: SettlementAssetEnum | null
}

type CreateCompanyFormErrors = Partial<Record<keyof CreateCompanyFormValues, string>>

/**
 * Company creation screen backed by the on-chain CompanyRegistry contract.
 */
export function CreateCompanyPageContent() {
  const router = useRouter()
  const { createCompany, isCreatingCompany, settlementAssets } = useStoreContext()
  const [formValues, setFormValues] = useState<CreateCompanyFormValues>({
    name: '',
    // description: '',
    payrollDayOfMonth: 15,
    settlementAsset: SettlementAssetEnum.USDC,
  })
  const [formErrors, setFormErrors] = useState<CreateCompanyFormErrors>({})

  const settlementAssetOptions = useMemo(() => settlementAssets, [settlementAssets])

  const selectedSettlementAsset = useMemo(() => {
    return settlementAssetOptions.find(asset => asset.value === formValues.settlementAsset) ?? null
  }, [formValues.settlementAsset, settlementAssetOptions])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(128,131,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(183,109,255,0.1),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, rgba(144,143,160,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(144,143,160,0.4) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10 sm:px-6 sm:py-16">
        <Card className="w-full rounded-xl border border-outline-variant/20 bg-surface-container/72 py-0 shadow-[0_40px_120px_-48px_rgba(6,14,32,0.72)] backdrop-blur-xl">
          <CardHeader className="gap-5 border-b border-outline-variant/16 px-6 py-6 sm:px-8 sm:py-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface p-0"
            >
              <ArrowBackIcon className="size-4" />
              Back
            </Button>
            <div className="space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/12">
                <BusinessIcon className="size-7" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  Initialize Sovereign Vault
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Create a company on-chain and bind its monthly payroll rule and settlement token in a single transaction.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
            <form
              className="space-y-8"
              onSubmit={async (event) => {
                event.preventDefault()

                const parsedForm = createCompanySchema.safeParse(formValues)
                if (!parsedForm.success) {
                  const nextErrors: CreateCompanyFormErrors = {}
                  for (const issue of parsedForm.error.issues) {
                    const fieldName = issue.path[0]
                    if (typeof fieldName === 'string') {
                      nextErrors[fieldName as keyof CreateCompanyFormValues] = issue.message
                    }
                  }
                  setFormErrors(nextErrors)
                  return
                }

                if (settlementAssetOptions.length === 0) {
                  setFormErrors({
                    settlementAsset: 'No settlement asset is enabled on the current network.',
                  })
                  return
                }

                setFormErrors({})

                const createdCompany = await createCompany(parsedForm.data)
                if (!createdCompany) {
                  return
                }

                router.push('/onboarding')
              }}
            >
              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b border-outline-variant/16 pb-3">
                  <BusinessIcon className="size-5 text-primary" />
                  <h2 className="font-heading text-lg font-semibold text-on-surface">Entity Details</h2>
                </div>

                <div className="space-y-2">
                  <label htmlFor="company-name" className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    Company Name
                  </label>
                  <Input
                    id="company-name"
                    placeholder="e.g. Acme Corp LLC"
                    className="h-12 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 shadow-none"
                    value={formValues.name}
                    onChange={event => setFormValues(prevState => ({ ...prevState, name: event.target.value }))}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  )}
                </div>

                {/* <div className="space-y-2">
                  <label htmlFor="company-description" className="text-sm font-medium text-on-surface">
                    Company Description
                  </label>
                  <Textarea
                    id="company-description"
                    placeholder="Optional internal note for the front end."
                    className="min-h-28 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 py-3 shadow-none"
                    value={formValues.description}
                    onChange={event => setFormValues(prevState => ({ ...prevState, description: event.target.value }))}
                  />
                </div> */}
              </section>

              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b border-outline-variant/16 pb-3">
                  <MdOutlineAccountBalance className="size-5 text-tertiary" />
                  <h2 className="font-heading text-lg font-semibold text-on-surface">Financial Parameters</h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="primary-asset" className="flex items-center gap-2 text-sm font-medium text-on-surface">
                      Primary Disbursement Asset
                    </label>
                    <Select<SettlementAssetEnum>
                      items={settlementAssetOptions}
                      value={formValues.settlementAsset}
                      onValueChange={(value) => {
                        setFormValues(prevState => ({
                          ...prevState,
                          settlementAsset: value,
                        }))
                      }}
                    >
                      <SelectTrigger
                        id="primary-asset"
                        className="h-12 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 shadow-none"
                      >
                        <SelectValue placeholder="Select settlement asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {settlementAssetOptions.map(asset => (
                          <SelectItem key={asset.value} value={asset.value} role="button">
                            {asset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.settlementAsset && (
                      <p className="text-xs text-destructive">{formErrors.settlementAsset}</p>
                    )}
                    {selectedSettlementAsset && (
                      <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <InfoIcon className="size-3.5" />
                        Uses {selectedSettlementAsset.symbol} with {selectedSettlementAsset.decimals} decimals on this network.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="payroll-day" className="flex items-center gap-2 text-sm font-medium text-on-surface">
                      Payroll Day of Month
                      <CalendarIcon className="size-4 text-primary/75" />
                    </label>
                    <Input
                      id="payroll-day"
                      type="number"
                      min={1}
                      max={28}
                      className="h-12 rounded-lg border-outline-variant/12 bg-surface-container-highest/90 px-4 font-mono shadow-none"
                      value={formValues.payrollDayOfMonth}
                      onChange={event => setFormValues(prevState => ({ ...prevState, payrollDayOfMonth: Number(event.target.value) }))}
                    />
                    {formErrors.payrollDayOfMonth && (
                      <p className="text-xs text-destructive">{formErrors.payrollDayOfMonth}</p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <InfoIcon className="size-3.5" />
                      Use 1-28 to avoid invalid dates in short months.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-outline-variant/16 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button size="lg" type="submit" className="rounded-lg px-6" disabled={isCreatingCompany}>
                  {isCreatingCompany && <MdOutlineRefresh className={cn('size-4', 'animate-spin')} />}
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
