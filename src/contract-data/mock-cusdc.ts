import type { Address } from 'viem'

export const MockCUSDC = {
  addresses: {
    31337: '0x8659DF1C638CDA8E475CD3C6481730C2b4f85873',
    11155111: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
  } as Record<number, Address>,
  abi: [],
} as const
