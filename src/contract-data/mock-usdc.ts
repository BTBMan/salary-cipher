import type { Address } from 'viem'

export const MockUSDC = {
  addresses: {
    31337: '0x449C286Ab90639fd9F6604F4f15Ec86bce2b8A61',
    11155111: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
  } as Record<number, Address>,
  abi: [],
} as const
