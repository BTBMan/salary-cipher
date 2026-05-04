import type { Address } from 'viem'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { RolesEnum, SettlementAssetEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture } from './fixtures'
import { createUnwrapDecryptionProof, customErrorPattern, decryptUint64 } from './utils'

const assetCases = [
  { label: 'USDC', asset: SettlementAssetEnum.USDC },
  { label: 'USDT', asset: SettlementAssetEnum.USDT },
] as const

for (const assetCase of assetCases) {
  describe(`companyTreasuryVault (${assetCase.label})`, () => {
    async function companyFixture() {
      return createSalaryCipherCompanyFixture({ asset: assetCase.asset })
    }

    it('deposits and wraps underlying funds into confidential balance atomically', async () => {
      const { companyTreasuryVault, underlyingToken, settlementToken, owner, publicClient }
        = await loadFixture(companyFixture)

      const approveHash = await underlyingToken.write.approve(
        [companyTreasuryVault.address, 1_000_000n],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      const depositHash = await companyTreasuryVault.write.depositAndWrapUnderlying([1_000_000n], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: depositHash })

      expect(await underlyingToken.read.balanceOf([companyTreasuryVault.address])).to.equal(0n)
      expect(await underlyingToken.read.balanceOf([settlementToken.address])).to.equal(1_000_000n)

      const vaultEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        companyTreasuryVault.address,
      ])
      expect(await decryptUint64(vaultEncryptedBalance, settlementToken.address, owner)).to.equal(1_000_000n)
    })

    it('restricts treasury funding operations to the company owner', async () => {
      const { companyTreasuryVault, outsider } = await loadFixture(companyFixture)

      await expect(
        companyTreasuryVault.write.depositAndWrapUnderlying([1n], {
          account: outsider.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('CompanyTreasuryVault__Unauthorized'))
    })

    it('syncs wrapped balance decrypt access when HR permissions change', async () => {
      const { companyRegistry, companyTreasuryVault, underlyingToken, settlementToken, owner, hr, companyId, publicClient }
        = await loadFixture(companyFixture)

      const approveHash = await underlyingToken.write.approve(
        [companyTreasuryVault.address, 1_000_000n],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      const depositHash = await companyTreasuryVault.write.depositAndWrapUnderlying([1_000_000n], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: depositHash })

      const addHrHash = await companyRegistry.write.addEmployee(
        [companyId, hr.account.address, RolesEnum.HR, 'Helen'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addHrHash })

      const hrBalanceHandle = await settlementToken.read.confidentialBalanceOf([
        companyTreasuryVault.address,
      ])
      expect(await decryptUint64(hrBalanceHandle, settlementToken.address, hr)).to.equal(1_000_000n)

      const demoteHrHash = await companyRegistry.write.updateRole(
        [companyId, hr.account.address, RolesEnum.Employee],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: demoteHrHash })

      const rotatedBalanceHandle = await settlementToken.read.confidentialBalanceOf([
        companyTreasuryVault.address,
      ])
      expect(await decryptUint64(rotatedBalanceHandle, settlementToken.address, owner)).to.equal(1_000_000n)
      await expect(
        decryptUint64(rotatedBalanceHandle, settlementToken.address, hr),
      ).to.be.rejectedWith(/not authorized/i)
    })

    it('refunds the full wrapped vault balance back to the owner', async () => {
      const { companyTreasuryVault, underlyingToken, settlementToken, owner, publicClient }
        = await createSalaryCipherCompanyFixture({ asset: assetCase.asset })

      const approveHash = await underlyingToken.write.approve(
        [companyTreasuryVault.address, 1_000_000n],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      const depositHash = await companyTreasuryVault.write.depositAndWrapUnderlying([1_000_000n], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: depositHash })
      const ownerBalanceBeforeRefund = await underlyingToken.read.balanceOf([owner.account.address])

      const { result: unwrapRequestId } = await companyTreasuryVault.simulate.refundAllWrappedUnderlying(
        { account: owner.account.address },
      )
      const unwrapHash = await companyTreasuryVault.write.refundAllWrappedUnderlying(
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: unwrapHash })

      const encryptedAmount = await settlementToken.read.unwrapAmount([unwrapRequestId]) as Address
      const decryptionProof = await createUnwrapDecryptionProof(encryptedAmount, 1_000_000n)

      const finalizeHash = await settlementToken.write.finalizeUnwrap(
        [unwrapRequestId, 1_000_000n, decryptionProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: finalizeHash })

      expect(await underlyingToken.read.balanceOf([owner.account.address])).to.equal(ownerBalanceBeforeRefund + 1_000_000n)
      expect(await underlyingToken.read.balanceOf([settlementToken.address])).to.equal(0n)
    })

    it('withdraws unused underlying tokens without touching wrapped funds', async () => {
      const { companyTreasuryVault, underlyingToken, owner, outsider, publicClient }
        = await createSalaryCipherCompanyFixture({ asset: assetCase.asset })

      const approveHash = await underlyingToken.write.approve(
        [companyTreasuryVault.address, 1_000_000n],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      const depositHash = await underlyingToken.write.transfer([companyTreasuryVault.address, 1_000_000n], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: depositHash })

      const withdrawHash = await companyTreasuryVault.write.withdrawUnusedUnderlying(
        [300_000n, outsider.account.address],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: withdrawHash })

      expect(await underlyingToken.read.balanceOf([companyTreasuryVault.address])).to.equal(700_000n)
      expect(await underlyingToken.read.balanceOf([outsider.account.address])).to.equal(300_000n)
    })
  })
}
