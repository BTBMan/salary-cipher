import type { Address } from 'viem'
import { toFunctionSelector } from 'viem'

export function normalizeAddresses(addresses: readonly Address[]) {
  return addresses.map(address => address.toLowerCase())
}

export function customErrorSelector(errorName: string) {
  return toFunctionSelector(`${errorName}()`)
}

export function customErrorPattern(errorName: string) {
  return new RegExp(`${errorName}|${customErrorSelector(errorName)}`)
}
