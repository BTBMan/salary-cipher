import type { Address } from 'viem'

export const MockUSDT = {
  addresses: {
    31337: '0x63275D081C4A77AE69f76c4952F9747a5559a519',
    11155111: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
  } as Record<number, Address>,
  abi: [],
} as const
