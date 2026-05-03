'use client'

import type { FinanceTransactionRow } from '@/hooks'
import { useMemo, useState } from 'react'
import {
  MdAccountBalanceWallet as AccountBalanceWalletIcon,
  MdAddCircle as AddCircleIcon,
  MdArrowUpward as ArrowUpwardIcon,
  MdAutorenew as AutorenewIcon,
  MdDownload as DownloadIcon,
  MdFilterList as FilterListIcon,
  MdLock as LockIcon,
  MdOpenInNew as OpenInNewIcon,
  MdPayments as PaymentsIcon,
  MdShield as ShieldLockIcon,
} from 'react-icons/md'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/app-layout'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFinanceVault, useStoreContext } from '@/hooks'
import { cn, formatAddress, formatUnixDate } from '@/utils'

const TOKEN_AMOUNT_REGEX = /^\d+(\.\d+)?$/

const depositSchema = z.object({
  amount: z.string().trim().refine((value) => {
    if (!value) {
      return false
    }

    const numericValue = Number(value)
    return TOKEN_AMOUNT_REGEX.test(value) && Number.isFinite(numericValue) && numericValue > 0
  }, 'Deposit amount must be greater than zero.'),
})

function formatTokenAmount(value: string | null, fallback = '••••••••') {
  if (!value) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value))
}

function getTransactionMeta(type: FinanceTransactionRow['type']) {
  switch (type) {
    case 'deposit':
      return {
        bgColor: 'bg-primary/10',
        icon: AccountBalanceWalletIcon,
        iconColor: 'text-primary',
        label: 'Vault Deposit',
        status: 'Confirmed',
      }
    case 'wrap':
      return {
        bgColor: 'bg-tertiary/10',
        icon: ShieldLockIcon,
        iconColor: 'text-tertiary',
        label: 'Confidential Wrap',
        status: 'Confirmed',
      }
    case 'payroll':
      return {
        bgColor: 'bg-tertiary/10',
        icon: PaymentsIcon,
        iconColor: 'text-tertiary',
        label: 'Payroll Execution',
        status: 'Confirmed',
      }
    case 'refund-request':
      return {
        bgColor: 'bg-primary/10',
        icon: ArrowUpwardIcon,
        iconColor: 'text-primary',
        label: 'Withdraw Request',
        status: 'Requested',
      }
  }
}

function getRowDate(row: FinanceTransactionRow) {
  if (row.executedAt) {
    return formatUnixDate(row.executedAt)
  }

  return row.blockNumber > 0n ? `Block ${row.blockNumber.toString()}` : '-'
}

export default function FinancePage() {
  const { selectedCompany } = useStoreContext()
  const finance = useFinanceVault(selectedCompany)
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositError, setDepositError] = useState<string | null>(null)
  const salarySymbol = finance.selectedSettlementAsset?.symbol ?? 'USDC'
  const vaultBalanceLabel = finance.vaultConfidentialBalance
    ? formatTokenAmount(finance.vaultConfidentialBalance)
    : finance.vaultConfidentialBalanceHandle
      ? 'Encrypted'
      : '0.00'
  const hasWrappedBalance = Boolean(finance.vaultConfidentialBalanceHandle)
  const healthStatus = finance.treasuryVaultConfigured
    ? hasWrappedBalance
      ? 'Ready'
      : 'Needs Funding'
    : 'Missing'
  const healthClassName = hasWrappedBalance
    ? 'text-emerald-400'
    : finance.treasuryVaultConfigured
      ? 'text-amber-300'
      : 'text-destructive'
  const healthDotClassName = hasWrappedBalance
    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
    : finance.treasuryVaultConfigured
      ? 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.5)]'
      : 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]'
  const utilizationPercent = hasWrappedBalance ? 100 : 0
  const latestTransactions = useMemo(() => finance.transactionRows.slice(0, 10), [finance.transactionRows])

  const handleDeposit = async () => {
    const result = depositSchema.safeParse({ amount: depositAmount })
    if (!result.success) {
      setDepositError(result.error.issues[0]?.message ?? 'Invalid deposit amount.')
      return
    }

    setDepositError(null)
    const deposited = await finance.depositAndWrap(result.data.amount)
    if (deposited) {
      setDepositAmount('')
      setIsDepositDialogOpen(false)
    }
  }

  const handleWithdraw = async () => {
    const requested = await finance.withdrawWrappedBalance()
    if (requested) {
      setIsWithdrawDialogOpen(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Top Header Section */}
        <div className="flex flex-col gap-1 px-1">
          <h1 className="text-3xl font-heading font-black text-on-surface tracking-tight">Finance & Vault</h1>
          <p className="text-on-surface-variant text-sm font-medium opacity-80">Managing liquidity and encrypted treasury operations for automated payroll.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="group min-h-70 rounded-xl border-y-0 border-r-0 border-l-4 border-primary bg-surface-container-low p-0 shadow-2xl">
              <CardContent className="relative flex h-full flex-col justify-between p-8">
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] uppercase mb-4 block">Vault Wrapped Balance</span>
                  <div className="flex items-baseline gap-3 mb-8">
                    <div className="relative inline-flex flex-col">
                      <span className="text-primary font-heading text-5xl font-black tracking-tighter">{vaultBalanceLabel}</span>
                      <div className="absolute inset-0 bg-secondary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-outline text-xl font-black uppercase tracking-tighter">{salarySymbol}</span>
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/5 bg-surface-container-lowest p-3">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-outline">Wallet Balance</span>
                      <span className="font-mono text-sm font-bold text-on-surface">
                        {formatTokenAmount(finance.ownerUnderlyingBalance, '-')} {salarySymbol}
                      </span>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-surface-container-lowest p-3">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-outline">Unwrapped In Vault</span>
                      <span className="font-mono text-sm font-bold text-on-surface">
                        {formatTokenAmount(finance.vaultUnusedUnderlyingBalance, '-')} {salarySymbol}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      className="primary-gradient flex-1 text-on-primary-container h-12 rounded-sm text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all border-none shadow-lg shadow-primary/20"
                      disabled={!finance.treasuryVaultConfigured || finance.isDepositing}
                      onClick={() => setIsDepositDialogOpen(true)}
                    >
                      {finance.isDepositing ? <AutorenewIcon className="size-5 animate-spin" /> : <AddCircleIcon className="size-5" />}
                      Deposit
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-white/10 hover:bg-surface-container h-12 rounded-sm text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      disabled={!finance.treasuryVaultConfigured || !hasWrappedBalance || finance.isWithdrawingWrapped}
                      onClick={() => setIsWithdrawDialogOpen(true)}
                    >
                      {finance.isWithdrawingWrapped ? <AutorenewIcon className="size-5 animate-spin" /> : <ArrowUpwardIcon className="size-5" />}
                      Withdraw
                    </Button>
                  </div>
                  {finance.vaultConfidentialBalanceHandle && !finance.vaultConfidentialBalance && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container-lowest px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Wrapped balance is encrypted</span>
                      <Button
                        className="h-8 rounded-sm text-[10px] font-black uppercase tracking-widest"
                        disabled={!finance.canDecryptVaultBalance || finance.isDecryptingVaultBalance}
                        size="sm"
                        variant="outline"
                        onClick={() => finance.decryptVaultBalance()}
                      >
                        {finance.isDecryptingVaultBalance && <AutorenewIcon className="size-3 animate-spin" />}
                        Reveal
                      </Button>
                    </div>
                  )}
                  {finance.vaultConfidentialBalanceError && (
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-destructive">{finance.vaultConfidentialBalanceError}</p>
                  )}
                </div>
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
              </CardContent>
            </Card>

            {/* Yield Metric */}
            <Card className="rounded-xl border border-white/5 bg-surface-container p-0 shadow-xl">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-1.5 block">Yield Generated (30d)</span>
                  <span className="text-on-surface font-heading text-2xl font-black tracking-tight">Not available <span className="text-xs text-outline font-black">{salarySymbol}</span></span>
                </div>
                <div className="h-10 w-24 bg-surface-container-low rounded-sm flex items-end gap-1 p-2 border border-white/5 opacity-40">
                  <div className="w-2 bg-primary/40 h-1/2 rounded-t-[1px]" />
                  <div className="w-2 bg-primary/60 h-2/3 rounded-t-[1px]" />
                  <div className="w-2 bg-primary/80 h-3/4 rounded-t-[1px]" />
                  <div className="w-2 bg-primary h-full rounded-t-[1px] shadow-[0_0_8px_#c0c1ff]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Vault Health (7/12) */}
          <Card className="lg:col-span-7 rounded-xl border border-white/5 bg-surface-container p-0 shadow-2xl">
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldLockIcon className="text-tertiary size-6 fill-current" />
                    <h3 className="text-white font-heading text-2xl font-bold tracking-tight">Company Fund Pool</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium opacity-80">
                    {finance.treasuryVaultConfigured ? formatAddress(finance.treasuryVault) : 'Treasury vault is not configured.'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-on-surface-variant tracking-widest uppercase block mb-1.5 opacity-60">Health Status</span>
                  <div className="flex items-center gap-2.5 justify-end">
                    <div className={cn('w-2 h-2 rounded-full animate-pulse', healthDotClassName)} />
                    <span className={cn('font-black text-xs uppercase tracking-widest', healthClassName)}>{healthStatus}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-on-surface opacity-80">Vault Funding State</span>
                    <span className="text-primary font-mono">{utilizationPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner border border-white/5">
                    <div
                      className="h-full bg-linear-to-r from-primary to-tertiary rounded-full shadow-[0_0_15px_rgba(192,193,255,0.4)]"
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 shadow-inner">
                    <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-2 block">Months Remaining</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-4xl font-heading font-black tracking-tighter">N/A</span>
                      <span className="text-outline text-xs font-black uppercase tracking-widest">Cycles</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 flex flex-col justify-center shadow-inner">
                    <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-4 block">Quick Top Up</span>
                    <div className="flex gap-2">
                      <Button disabled variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-surface-bright">
                        +1m
                      </Button>
                      <Button disabled variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-surface-bright">
                        +3m
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        className="h-10 flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        disabled={!finance.treasuryVaultConfigured || finance.isDepositing}
                        onClick={() => setIsDepositDialogOpen(true)}
                      >
                        Custom
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container py-0 shadow-2xl">
          <CardContent className="px-0">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high/30">
              <h3 className="text-white font-heading text-xl font-bold tracking-tight">Transaction History</h3>
              <div className="flex items-center gap-6">
                <Button disabled variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white">
                  <FilterListIcon className="size-4" />
                  Filter
                </Button>
                <Button disabled variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-white">
                  <DownloadIcon className="size-4" />
                  Export
                </Button>
              </div>
            </div>
            <Table className="text-left">
              <TableHeader className="bg-surface-container-low">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Execution Date</TableHead>
                  <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Transaction Type</TableHead>
                  <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Amount</TableHead>
                  <TableHead className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Status</TableHead>
                  <TableHead className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">On-Chain Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.isLoading
                  ? (
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableCell className="px-8 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                          <div className="flex items-center justify-center gap-2">
                            <AutorenewIcon className="size-4 animate-spin" />
                            Loading finance data
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : latestTransactions.length === 0
                    ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell className="px-8 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                            No treasury transactions found.
                          </TableCell>
                        </TableRow>
                      )
                    : latestTransactions.map((tx) => {
                        const meta = getTransactionMeta(tx.type)
                        return (
                          <TableRow key={`${tx.hash}-${tx.logIndex}`} className="group cursor-pointer border-white/5 hover:bg-surface-container-high/40">
                            <TableCell className="px-8 py-6">
                              <div className="text-sm text-white font-bold tracking-tight">{getRowDate(tx)}</div>
                              <div className="text-[10px] text-outline font-black uppercase mt-1 tracking-widest">Block {tx.blockNumber.toString()}</div>
                            </TableCell>
                            <TableCell className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 shadow-inner', meta.bgColor)}>
                                  <meta.icon className={cn('size-5', meta.iconColor)} />
                                </div>
                                <span className="text-sm text-white font-bold tracking-tight">{meta.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-6">
                              <div className="relative min-w-36 h-10 bg-surface-container-lowest rounded-lg overflow-hidden flex items-center px-4 border border-white/5 group-hover:border-primary/30 transition-all">
                                <span className="text-sm font-['JetBrains_Mono'] font-bold text-white z-10">
                                  {tx.amount ? `${formatTokenAmount(tx.amount)} ${salarySymbol}` : tx.requestId ? 'Full wrapped balance' : 'Encrypted'}
                                </span>
                                {!tx.amount && <LockIcon className="text-tertiary size-3.5 absolute right-3 opacity-60 fill-current" />}
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-6 text-center">
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-sm border border-emerald-500/20">{meta.status}</span>
                            </TableCell>
                            <TableCell className="px-8 py-6 text-right">
                              <div className="font-['JetBrains_Mono'] text-[11px] text-outline hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-2 font-bold group/hash">
                                {formatAddress(tx.hash)}
                                <OpenInNewIcon className="size-3 opacity-60 group-hover/hash:opacity-100" />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
              </TableBody>
            </Table>
            <div className="p-6 text-center border-t border-white/5 bg-surface-container-lowest/10">
              <Button disabled variant="ghost" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white">Load More Transactions</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
          <DialogHeader className="border-b border-white/5 px-6 py-5">
            <DialogTitle>Deposit treasury funds</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              This will approve {salarySymbol}, deposit it into the company vault, then wrap it into the confidential settlement token.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Amount</label>
              <Input
                aria-invalid={Boolean(depositError)}
                className="h-12 rounded border-outline-variant/20 bg-surface-container-lowest px-4 font-mono text-sm font-medium text-on-surface shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                inputMode="decimal"
                placeholder={`0.00 ${salarySymbol}`}
                value={depositAmount}
                onChange={(event) => {
                  setDepositError(null)
                  setDepositAmount(event.target.value)
                }}
              />
              {depositError && <p className="text-xs font-bold text-destructive">{depositError}</p>}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
              Wallet balance: {formatTokenAmount(finance.ownerUnderlyingBalance, '-')} {salarySymbol}
            </p>
          </div>
          <DialogFooter className="border-t border-white/5 px-6 py-5">
            <Button
              disabled={finance.isDepositing}
              variant="outline"
              onClick={() => setIsDepositDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="primary-gradient border-none text-on-primary-container"
              disabled={finance.isDepositing}
              onClick={() => {
                void handleDeposit()
              }}
            >
              {finance.isDepositing && <AutorenewIcon className="size-4 animate-spin" />}
              Deposit &amp; Wrap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-surface-container p-0">
          <DialogHeader className="border-b border-white/5 px-6 py-5">
            <DialogTitle>Withdraw wrapped treasury balance</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              This requests an unwrap of the vault&apos;s full confidential balance back to the company owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-lg border border-white/5 bg-surface-container-lowest p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Wrapped balance</p>
              <p className="mt-2 font-mono text-lg font-black text-on-surface">{vaultBalanceLabel} {salarySymbol}</p>
            </div>
            <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
              The unwrap flow is asynchronous. The request will be visible on-chain after this transaction confirms.
            </p>
          </div>
          <DialogFooter className="border-t border-white/5 px-6 py-5">
            <Button
              disabled={finance.isWithdrawingWrapped}
              variant="outline"
              onClick={() => setIsWithdrawDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="primary-gradient border-none text-on-primary-container"
              disabled={finance.isWithdrawingWrapped}
              onClick={() => {
                void handleWithdraw()
              }}
            >
              {finance.isWithdrawingWrapped && <AutorenewIcon className="size-4 animate-spin" />}
              Confirm Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
