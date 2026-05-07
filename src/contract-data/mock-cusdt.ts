import type { Address } from 'viem'

export const MockCUSDT = {
  addresses: {
    31337: '0x1f9c84B161b2c7FFB540BC5354543108cCE37df1',
  } as Record<number, Address>,
  abi: [],
} as const
