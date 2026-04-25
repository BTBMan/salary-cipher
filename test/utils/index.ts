import type { Address, WalletClient } from 'viem'
import { FhevmType } from '@fhevm/hardhat-plugin'
import { fhevm } from 'hardhat'
import { toFunctionSelector, toHex } from 'viem'
import { ethersWrapper } from '../../src/utils'

export function normalizeAddresses(addresses: readonly Address[]) {
  return addresses.map(address => address.toLowerCase())
}

export function customErrorSelector(errorName: string) {
  return toFunctionSelector(`${errorName}()`)
}

export function customErrorPattern(errorName: string) {
  return new RegExp(`${errorName}|${customErrorSelector(errorName)}`)
}

export async function encryptUint128(contractAddress: Address, userAddress: Address, value: number) {
  const encrypted = await fhevm
    .createEncryptedInput(contractAddress, userAddress)
    .add128(value)
    .encrypt()

  return [toHex(encrypted.handles[0]), toHex(encrypted.inputProof)] as const
}

export async function decryptUint128(
  handle: string,
  contractAddress: Address,
  walletClient: WalletClient,
) {
  return await fhevm.userDecryptEuint(
    FhevmType.euint128,
    handle,
    contractAddress,
    ethersWrapper(walletClient).ethersSigner()!,
  )
}

export async function decryptBool(
  handle: string,
  contractAddress: Address,
  walletClient: WalletClient,
) {
  return await fhevm.userDecryptEbool(
    handle,
    contractAddress,
    ethersWrapper(walletClient).ethersSigner()!,
  )
}
