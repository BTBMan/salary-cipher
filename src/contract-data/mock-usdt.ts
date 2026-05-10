import type { Address } from 'viem'

export const MockUSDT = {
  addresses: {
    31337: '0x9E545E3C0baAB3E08CdfD552C960A1050f373042',
    11155111: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
  } as Record<number, Address>,
  abi: [],
} as const
