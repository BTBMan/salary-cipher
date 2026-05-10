import type { Address } from 'viem'

export const MockCUSDC = {
  addresses: {
    31337: '0xf5059a5D33d5853360D16C683c16e67980206f36',
    11155111: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
  } as Record<number, Address>,
  abi: [],
} as const
