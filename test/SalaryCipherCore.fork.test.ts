import { loadFixture, reset, time } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { viem } from 'hardhat'
import { vars } from 'hardhat/config'
import { parseAbi } from 'viem'
import { RolesEnum, SettlementAssetEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture } from './fixtures'
import {
  computeFollowingMonthlyPayrollTimestamp,
  computeNextMonthlyPayrollTimestamp,
  decryptUint64,
  encryptUint128,
  fundVault,
} from './utils'

const hasForkConfig
  = vars.has('SEPOLIA_RPC_URL')
    && vars.has('TEST_PRIVATE_KEY')
    && vars.has('TEST_PRIVATE_KEY2')

const describeFork = hasForkConfig ? describe.skip : describe.skip
const SEPOLIA_RPC_URL = hasForkConfig ? vars.get('SEPOLIA_RPC_URL') : ''

const assetCases = [
  {
    label: 'USDC',
    asset: SettlementAssetEnum.USDC,
    underlyingTokenAddress: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
  },
  {
    label: 'USDT',
    asset: SettlementAssetEnum.USDT,
    underlyingTokenAddress: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
  },
] as const

const erc20MetadataAbi = parseAbi([
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
])

for (const assetCase of assetCases) {
  describeFork(`salaryCipherCore fork (${assetCase.label})`, () => {
    before(async function () {
      await reset(SEPOLIA_RPC_URL)
      const publicClient = await viem.getPublicClient()

      try {
        await publicClient.readContract({
          address: assetCase.underlyingTokenAddress,
          abi: erc20MetadataAbi,
          functionName: 'symbol',
        })
        await publicClient.readContract({
          address: assetCase.underlyingTokenAddress,
          abi: erc20MetadataAbi,
          functionName: 'balanceOf',
          args: ['0x0000000000000000000000000000000000000000'],
        })
      }
      catch {
        this.skip()
      }
    })

    async function forkedCompanyFixture() {
      await reset(SEPOLIA_RPC_URL)
      return createSalaryCipherCompanyFixture({
        asset: assetCase.asset,
        useSepoliaAssets: true,
      })
    }

    it('executes payroll against the real Sepolia token and wrapper pair', async () => {
      const { companyRegistry, salaryCipherCore, companyTreasuryVault, settlementToken, underlyingToken, owner, employee, publicClient, companyId }
        = await loadFixture(forkedCompanyFixture)

      const ownerUnderlyingBalance = await underlyingToken.read.balanceOf([owner.account.address])
      if (ownerUnderlyingBalance < 1_000_000n) {
        throw new Error(`Fork test requires at least 1 ${assetCase.label} on owner account; current balance is ${ownerUnderlyingBalance}`)
      }

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Fork Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      await fundVault({
        underlyingToken,
        companyTreasuryVault,
        owner,
        publicClient,
        amount: 1_000_000n,
      })

      const [salaryHandle, salaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        500_000,
      )
      const setSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, employee.account.address, salaryHandle, salaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

      const latestBlock = await publicClient.getBlock()
      const nextPayrollTime = computeNextMonthlyPayrollTimestamp(latestBlock.timestamp, 15)
      const payrollTime = computeFollowingMonthlyPayrollTimestamp(nextPayrollTime, 15)

      await time.increaseTo(payrollTime)

      const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal(500_000n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(payrollTime)
    })
  })
}
