'use client'

import type { PayrollHistoryRow } from './types'
import {
  MdAutorenew as AutorenewIcon,
  MdOpenInNew as OpenInNewIcon,
  MdShield as ShieldPersonIcon,
} from 'react-icons/md'
import { EncryptedField } from '@/components/encrypted-field'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatAddress, formatUnixDate, getAvatarFallback } from '@/utils'

interface PayrollExecutionHistoryProps {
  canDecryptAmount?: boolean
  error: string | null
  historyRows: PayrollHistoryRow[]
  indexedTransferCount?: number
  isDecryptingAmount?: boolean
  isLoading: boolean
  onDecryptAmount?: () => void
  salarySymbol: string
  showTreasuryVaultFooter?: boolean
  treasuryVault?: string
  treasuryVaultConfigured?: boolean
}

export function PayrollExecutionHistory({
  canDecryptAmount = false,
  error,
  historyRows,
  indexedTransferCount = 0,
  isDecryptingAmount = false,
  isLoading,
  onDecryptAmount,
  salarySymbol,
  showTreasuryVaultFooter = false,
  treasuryVault,
  treasuryVaultConfigured = false,
}: PayrollExecutionHistoryProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-tertiary rounded-full shadow-[0_0_8px_#ddb7ff]" />
          <h2 className="font-heading text-2xl font-bold text-on-surface tracking-tight">Execution History</h2>
        </div>

        {/* Filters */}
        {/* <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <CalendarMonthIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-4" />
            <Select defaultValue="30d">
              <SelectTrigger className="h-9 rounded-lg border-none bg-surface-container pl-9 pr-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant shadow-lg focus-visible:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="q3">Q3 2024</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <FilterListIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-4" />
            <Select defaultValue="all">
              <SelectTrigger className="h-9 rounded-lg border-none bg-surface-container pl-9 pr-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant shadow-lg focus-visible:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div> */}
      </div>

      <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container py-0 shadow-2xl">
        <CardContent className="px-0">
          <Table className="text-left">
            <TableHeader className="bg-surface-container-high/50">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Execution Date</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Employee Entity</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Amount (FHE)</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Status</TableHead>
                <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Verification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? (
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                        <div className="flex items-center justify-center gap-2">
                          <AutorenewIcon className="size-4 animate-spin" />
                          Loading payroll events
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                : historyRows.length === 0
                  ? (
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={5}>
                          No payroll execution history found.
                        </TableCell>
                      </TableRow>
                    )
                  : historyRows.map(row => (
                      <TableRow key={`${row.transactionHash}-${row.recipient ?? 'self'}-${row.executedAt}`} className="group cursor-pointer border-white/5 hover:bg-surface-bright/10">
                        <TableCell className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-bold text-on-surface">{formatUnixDate(row.executedAt)}</span>
                            <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-outline">Tx: {formatAddress(row.transactionHash)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 rounded-full border border-white/10">
                              <AvatarFallback className="bg-surface-variant text-[8px] font-black">
                                {getAvatarFallback(row.recipientName, row.recipient ?? 'SC')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-on-surface leading-tight">{row.recipientName}</span>
                              <span className="font-mono text-[10px] text-outline font-bold tracking-tighter">
                                {row.recipient ? formatAddress(row.recipient) : '-'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 bg-surface-container-lowest border border-tertiary/10 px-3 py-1.5 rounded-lg group-hover:border-tertiary/40 transition-all relative overflow-hidden">
                            <div className="font-mono text-sm text-tertiary font-bold">
                              <EncryptedField
                                canDecrypt={canDecryptAmount}
                                className="inline-flex space-y-0"
                                isDecrypting={isDecryptingAmount}
                                isEncrypted={!row.amount && Boolean(row.amountHandle)}
                                value={row.amount ?? (row.amountHandle ? formatAddress(row.amountHandle) : 'Handle missing')}
                                valueClassName="font-mono text-sm text-tertiary font-bold"
                                onDecrypt={onDecryptAmount}
                              />
                              <span className="text-[10px] text-outline font-black"> {salarySymbol}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Paid
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          <Button disabled variant="link" size="sm" className="ml-auto h-auto px-0 text-[10px] font-black text-outline uppercase tracking-widest">
                            Indexed Event
                            <OpenInNewIcon className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>

          {error && (
            <div className="px-6 py-3 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {error}
            </div>
          )}

          {showTreasuryVaultFooter && (
            <div className="bg-surface-container-highest px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-white/10 shadow-inner">
                  <ShieldPersonIcon className="text-primary size-7 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant mb-1.5 opacity-60">Treasury Vault</p>
                  <p className="font-mono text-lg font-black text-on-surface tracking-tighter">
                    {treasuryVaultConfigured ? formatAddress(treasuryVault ?? '') : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-lowest/40 border border-white/5 px-8 py-4 rounded-xl flex flex-col items-center md:items-end shadow-2xl max-w-xs w-full">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-tertiary mb-1.5 opacity-80">Indexed Payroll Transfers</p>
                <p className="font-mono text-2xl font-black text-white tracking-tighter">{indexedTransferCount}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
