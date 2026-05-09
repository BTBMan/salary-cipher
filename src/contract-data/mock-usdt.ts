import type { Address } from 'viem'

export const MockUSDT = {
  addresses: {
    31337: '0x7E27bCbe2F0eDdA3E0AA12492950a6B8703b00FB',
    11155111: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
  } as Record<number, Address>,
  abi: [],
} as const
