import type { Address, PublicClient, WalletClient } from 'viem'
import { FhevmType } from '@fhevm/hardhat-plugin'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { fhevm } from 'hardhat'
import { toFunctionSelector, toHex } from 'viem'
import { ethersWrapper } from '../../src/utils'

dayjs.extend(utc)

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

export async function fundVault({
  underlyingToken,
  companyTreasuryVault,
  owner,
  publicClient,
  amount,
}: {
  underlyingToken: any
  companyTreasuryVault: any
  owner: WalletClient
  publicClient: PublicClient
  amount: bigint
}) {
  const approveHash = await underlyingToken.write.approve(
    [companyTreasuryVault.address, amount],
    { account: owner.account },
  )
  await publicClient.waitForTransactionReceipt({ hash: approveHash })

  const depositHash = await companyTreasuryVault.write.depositUnderlying([amount], {
    account: owner.account,
  })
  await publicClient.waitForTransactionReceipt({ hash: depositHash })

  const wrapHash = await companyTreasuryVault.write.wrapUnderlying([amount], {
    account: owner.account,
  })
  await publicClient.waitForTransactionReceipt({ hash: wrapHash })
}

/**
 * Returns the UTC timestamp for one month's payroll day.
 * If the configured day exceeds the month length, the last day of that month is used.
 */
export function computePayrollTimestamp(year: number, month: number, dayOfMonth: number) {
  const monthStart = dayjs.utc().year(year).month(month).date(1).startOf('day')
  const targetDay = Math.min(dayOfMonth, monthStart.daysInMonth())
  return BigInt(monthStart.date(targetDay).unix())
}

/**
 * Returns the next payroll date at or after the supplied timestamp.
 */
export function computeNextMonthlyPayrollTimestamp(timestamp: bigint, dayOfMonth: number) {
  const current = dayjs.unix(Number(timestamp)).utc()
  const currentMonthPayroll = computePayrollTimestamp(current.year(), current.month(), dayOfMonth)

  if (timestamp < currentMonthPayroll) {
    return currentMonthPayroll
  }

  const nextMonth = current.add(1, 'month')
  return computePayrollTimestamp(nextMonth.year(), nextMonth.month(), dayOfMonth)
}

/**
 * Returns the payroll date immediately following the supplied payroll timestamp.
 */
export function computeFollowingMonthlyPayrollTimestamp(payrollTimestamp: bigint, dayOfMonth: number) {
  const currentPayroll = dayjs.unix(Number(payrollTimestamp)).utc().add(1, 'month')
  return computePayrollTimestamp(currentPayroll.year(), currentPayroll.month(), dayOfMonth)
}
