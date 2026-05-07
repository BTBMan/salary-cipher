import type { Address } from 'viem'

export const MockUSDC = {
  addresses: {
    31337: '0x364C7188028348566E38D762f6095741c49f492B',
    11155111: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
  } as Record<number, Address>,
  abi: [],
} as const
