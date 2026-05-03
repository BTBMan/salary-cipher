import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { RolesEnum, SettlementAssetEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture, deploySalaryCipherCoreFixture } from './fixtures'
import { customErrorPattern, normalizeAddresses } from './utils'

describe('salaryCipherFactory', () => {
  it('deploys with registry and salary core through ignition', async () => {
    const { companyRegistry, salaryCipherCore, salaryCipherFactory } = await loadFixture(deploySalaryCipherCoreFixture)

    expect(normalizeAddresses([await salaryCipherFactory.read.companyRegistry()])).to.deep.equal(
      normalizeAddresses([companyRegistry.address]),
    )
    expect(normalizeAddresses([await salaryCipherFactory.read.salaryCipherCore()])).to.deep.equal(
      normalizeAddresses([salaryCipherCore.address]),
    )
    expect(normalizeAddresses([await companyRegistry.read.companyFactory()])).to.deep.equal(
      normalizeAddresses([salaryCipherFactory.address]),
    )
  })

  it('creates a company, deploys its vault, and authorizes the salary core', async () => {
    const { companyRegistry, salaryCipherCore, companyTreasuryVault, owner, companyId } = await loadFixture(createSalaryCipherCompanyFixture)

    const company = await companyRegistry.read.getCompany([companyId])
    const ownerEmployee = await companyRegistry.read.getEmployee([companyId, owner.account.address])
    const treasuryVault = await companyRegistry.read.getTreasuryVault([companyId])
    const authorizedCore = await companyRegistry.read.authorizedCallers([companyId, salaryCipherCore.address])

    expect(company.name).to.equal('Acme')
    expect(normalizeAddresses([company.owner])).to.deep.equal(normalizeAddresses([owner.account.address]))
    expect(ownerEmployee.role).to.equal(RolesEnum.Owner)
    expect(await companyRegistry.read.getCompanySettlementAsset([companyId])).to.equal(SettlementAssetEnum.USDC)
    expect(normalizeAddresses([treasuryVault])).to.deep.equal(normalizeAddresses([companyTreasuryVault.address]))
    expect(authorizedCore).to.equal(true)
  })

  it('rejects direct factory-only registry creation from non-factory callers', async () => {
    const { companyRegistry, owner } = await loadFixture(deploySalaryCipherCoreFixture)

    await expect(
      companyRegistry.write.createCompanyFor(
        [owner.account.address, 'Acme', 15, SettlementAssetEnum.USDC],
        { account: owner.account },
      ),
    ).to.be.rejectedWith(customErrorPattern('CompanyRegistry__OnlyCompanyFactory'))
  })
})
