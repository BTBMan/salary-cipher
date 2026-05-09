import type { Address } from 'viem'

export const MockCUSDC = {
  addresses: {
    31337: '0x02121128f1Ed0AdA5Df3a87f42752fcE4Ad63e59',
    11155111: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
  } as Record<number, Address>,
  abi: [],
} as const
