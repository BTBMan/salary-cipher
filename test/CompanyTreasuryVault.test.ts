import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { createSalaryCipherCompanyFixture } from './fixtures'
import { customErrorPattern } from './utils'

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
})
