import type { Address } from 'viem'

export const MockCUSDT = {
  addresses: {
    31337: '0x8729c0238b265BaCF6fE397E8309897BB5c40473',
    11155111: '0x4E7B06D78965594eB5EF5414c357ca21E1554491',
  } as Record<number, Address>,
  abi: [],
} as const
