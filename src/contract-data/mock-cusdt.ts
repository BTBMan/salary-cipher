import type { Address } from 'viem'

export const MockCUSDT = {
  addresses: {
    31337: '0x95D7fF1684a8F2e202097F28Dc2e56F773A55D02',
    11155111: '0x4E7B06D78965594eB5EF5414c357ca21E1554491',
  } as Record<number, Address>,
  abi: [],
} as const
