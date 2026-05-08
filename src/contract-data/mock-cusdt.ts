import type { Address } from 'viem'

export const MockCUSDT = {
  addresses: {
    31337: '0xA343B1FC2897b8C49A72A9A0B2675cB9c7664e8c',
    11155111: '0x4E7B06D78965594eB5EF5414c357ca21E1554491',
  } as Record<number, Address>,
  abi: [],
} as const
