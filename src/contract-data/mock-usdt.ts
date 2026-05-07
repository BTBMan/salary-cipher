import type { Address } from 'viem'

export const MockUSDT = {
  addresses: {
    31337: '0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7',
    11155111: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
  } as Record<number, Address>,
  abi: [],
} as const
