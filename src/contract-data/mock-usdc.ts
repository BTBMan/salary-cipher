import type { Address } from 'viem'

export const MockUSDC = {
  addresses: {
    31337: '0x364C7188028348566E38D762f6095741c49f492B',
  } as Record<number, Address>,
  abi: [],
} as const
