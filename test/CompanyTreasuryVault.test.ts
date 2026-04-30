import type { Address } from 'viem'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { createSalaryCipherCompanyFixture } from './fixtures'
import { createUnwrapDecryptionProof, customErrorPattern } from './utils'

describe('companyTreasuryVault', () => {
  it('deposits underlying funds and wraps them into confidential balance', async () => {
    const { companyTreasuryVault, underlyingToken, settlementToken, owner, publicClient }
      = await loadFixture(createSalaryCipherCompanyFixture)

    const approveHash = await underlyingToken.write.approve(
      [companyTreasuryVault.address, 25_000n],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: approveHash })

    const depositHash = await companyTreasuryVault.write.depositUnderlying([25_000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: depositHash })

    const wrapHash = await companyTreasuryVault.write.wrapUnderlying([25_000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: wrapHash })

    expect(await underlyingToken.read.balanceOf([companyTreasuryVault.address])).to.equal(0n)
    expect(await underlyingToken.read.balanceOf([settlementToken.address])).to.equal(25_000n)
  })

  it('restricts treasury funding operations to the company owner', async () => {
    const { companyTreasuryVault, outsider } = await loadFixture(createSalaryCipherCompanyFixture)

    await expect(
      companyTreasuryVault.write.depositUnderlying([1n], {
        account: outsider.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('CompanyTreasuryVault__Unauthorized'))
  })

  it('refunds the full wrapped vault balance back to the owner', async () => {
    const { companyTreasuryVault, underlyingToken, settlementToken, owner, publicClient }
      = await createSalaryCipherCompanyFixture()

    const approveHash = await underlyingToken.write.approve(
      [companyTreasuryVault.address, 25_000n],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: approveHash })

    const depositHash = await companyTreasuryVault.write.depositUnderlying([25_000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: depositHash })

    const wrapHash = await companyTreasuryVault.write.wrapUnderlying([25_000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: wrapHash })

    const { result: unwrapRequestId } = await companyTreasuryVault.simulate.refundAllWrappedUnderlying(
      { account: owner.account.address },
    )
    const unwrapHash = await companyTreasuryVault.write.refundAllWrappedUnderlying(
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: unwrapHash })

    const encryptedAmount = await settlementToken.read.unwrapAmount([unwrapRequestId]) as Address
    const decryptionProof = await createUnwrapDecryptionProof(encryptedAmount, 25_000n)

    const finalizeHash = await settlementToken.write.finalizeUnwrap(
      [unwrapRequestId, 25_000n, decryptionProof],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: finalizeHash })

    expect(await underlyingToken.read.balanceOf([owner.account.address])).to.equal(1_000_000n)
    expect(await underlyingToken.read.balanceOf([settlementToken.address])).to.equal(0n)
  })

  it('withdraws unused underlying tokens without touching wrapped funds', async () => {
    const { companyTreasuryVault, underlyingToken, owner, outsider, publicClient }
      = await createSalaryCipherCompanyFixture()

    const approveHash = await underlyingToken.write.approve(
      [companyTreasuryVault.address, 8_000n],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: approveHash })

    const depositHash = await companyTreasuryVault.write.depositUnderlying([8_000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: depositHash })

    const withdrawHash = await companyTreasuryVault.write.withdrawUnusedUnderlying(
      [3_000n, outsider.account.address],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: withdrawHash })

    expect(await underlyingToken.read.balanceOf([companyTreasuryVault.address])).to.equal(5_000n)
    expect(await underlyingToken.read.balanceOf([outsider.account.address])).to.equal(3_000n)
  })
})
