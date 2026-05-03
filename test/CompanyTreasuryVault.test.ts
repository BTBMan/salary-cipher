import type { Address } from 'viem'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { SettlementAssetEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture } from './fixtures'
import { createUnwrapDecryptionProof, customErrorPattern } from './utils'

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
    })

    it('restricts treasury funding operations to the company owner', async () => {
      const { companyTreasuryVault, outsider } = await loadFixture(companyFixture)

      await expect(
        companyTreasuryVault.write.depositAndWrapUnderlying([1n], {
          account: outsider.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('CompanyTreasuryVault__Unauthorized'))
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

      expect(await underlyingToken.read.balanceOf([owner.account.address])).to.equal(2_000_000n)
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
