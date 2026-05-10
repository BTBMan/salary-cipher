import type { Address } from 'viem'

export const MockCUSDT = {
  addresses: {
    31337: '0x95401dc811bb5740090279Ba06cfA8fcF6113778',
    11155111: '0x4E7B06D78965594eB5EF5414c357ca21E1554491',
  } as Record<number, Address>,
  abi: [],
} as const
