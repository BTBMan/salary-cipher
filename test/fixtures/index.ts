import { ignition, viem } from 'hardhat'
import CompanyRegistryModule from '../../ignition/modules/CompanyRegistry'
import SalaryCipherCoreModule from '../../ignition/modules/SalaryCipherCore'

/**
 * Deploys CompanyRegistry through ignition and exposes the default wallet set used in tests.
 */
export async function deployCompanyRegistryFixture() {
  const [owner, hr, employee, outsider, anotherEmployee] = await viem.getWalletClients()
  const publicClient = await viem.getPublicClient()
  const { companyRegistry } = await ignition.deploy(CompanyRegistryModule)

  return {
    companyRegistry,
    owner,
    hr,
    employee,
    outsider,
    anotherEmployee,
    publicClient,
  }
}

/**
 * Deploys SalaryCipherCore and its dependent CompanyRegistry through ignition.
 */
export async function deploySalaryCipherCoreFixture() {
  const [owner, hr, employee, outsider] = await viem.getWalletClients()
  const publicClient = await viem.getPublicClient()
  const { companyRegistry, salaryCipherCore } = await ignition.deploy(SalaryCipherCoreModule)

  return {
    companyRegistry,
    salaryCipherCore,
    owner,
    hr,
    employee,
    outsider,
    publicClient,
  }
}

/**
 * Creates a default company used by CompanyRegistry tests.
 */
export async function createDefaultCompanyFixture() {
  const fixture = await deployCompanyRegistryFixture()
  const { companyRegistry, owner, publicClient } = fixture

  const hash = await companyRegistry.write.createCompany(['Acme', 15], {
    account: owner.account,
  })
  await publicClient.waitForTransactionReceipt({ hash })

  return { ...fixture, companyId: 1n }
}

/**
 * Creates a default company used by SalaryCipherCore tests.
 */
export async function createSalaryCipherCompanyFixture() {
  const fixture = await deploySalaryCipherCoreFixture()
  const { companyRegistry, owner, publicClient } = fixture

  const hash = await companyRegistry.write.createCompany(['Acme', 15], {
    account: owner.account,
  })
  await publicClient.waitForTransactionReceipt({ hash })

  return { ...fixture, companyId: 1n }
}
