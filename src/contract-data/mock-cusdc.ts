import type { Address } from 'viem'

export const MockCUSDC = {
  addresses: {
    31337: '0xf4fa0d1C10c47cDe9F65D56c3eC977CbEb13449A',
    11155111: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
  } as Record<number, Address>,
  abi: [],
} as const
