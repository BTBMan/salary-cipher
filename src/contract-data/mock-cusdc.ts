import type { Address } from 'viem'

export const MockCUSDC = {
  addresses: {
    31337: '0xe3e4631D734e4b3F900AfcC396440641Ed0df339',
    11155111: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
  } as Record<number, Address>,
  abi: [],
} as const
