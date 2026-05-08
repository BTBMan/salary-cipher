import type { Address } from 'viem'

export const MockUSDT = {
  addresses: {
    31337: '0x23228469b3439d81DC64e3523068976201bA08C3',
    11155111: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
  } as Record<number, Address>,
  abi: [],
} as const
