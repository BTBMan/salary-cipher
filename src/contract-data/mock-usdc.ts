import type { Address } from 'viem'

export const MockUSDC = {
  addresses: {
    31337: '0x3358F984e9B3CBBe976eEFE9B6fb92a214162932',
    11155111: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
  } as Record<number, Address>,
  abi: [],
} as const
