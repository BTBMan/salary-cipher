import type { Address } from 'viem'

export const MockUSDC = {
  addresses: {
    31337: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
    11155111: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
  } as Record<number, Address>,
  abi: [],
} as const
