import type { Address } from 'viem'

export const MockUSDC = {
  addresses: {
    31337: '0x2963ff0196a901ec3F56d7531e7C4Ce8F226462B',
    11155111: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
  } as Record<number, Address>,
  abi: [],
} as const
