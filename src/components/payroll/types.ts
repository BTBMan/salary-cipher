import type { useOverviewChainData } from '@/hooks'
import type { Address, Hex } from 'viem'

export type PayrollOverviewData = ReturnType<typeof useOverviewChainData>

export interface PayrollHistoryRow {
  amount: string | null
  amountHandle: Hex | null
  executedAt: number
  recipient: Address | string | null | undefined
  recipientName: string
  transactionHash: Hex
}
