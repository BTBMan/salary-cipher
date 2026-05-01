import { ignition, viem } from 'hardhat'
import CompanyRegistryModule from '../../ignition/modules/CompanyRegistry'
import SalaryCipherCoreModule from '../../ignition/modules/SalaryCipherCore'
import { SettlementAssetEnum } from '../../src/enums'

interface DeploymentOptions {
  useSepoliaAssets?: boolean
}

interface CompanyFixtureOptions extends DeploymentOptions {
  asset?: SettlementAssetEnum
}

function resolveAssetContracts<T extends Pick<Awaited<ReturnType<typeof deployCompanyRegistryFixture>>, 'usdc' | 'usdt' | 'cUsdc' | 'cUsdt'>>(deployment: T, asset: SettlementAssetEnum) {
  if (asset === SettlementAssetEnum.USDT) {
    return {
      underlyingToken: deployment.usdt,
      settlementToken: deployment.cUsdt,
    }
  }

  return {
    underlyingToken: deployment.usdc,
    settlementToken: deployment.cUsdc,
  }
}

/**
 * Deploys CompanyRegistry through ignition and exposes the default wallet set used in tests.
 */
export async function deployCompanyRegistryFixture() {
  const [owner, hr, employee, outsider, anotherEmployee] = await viem.getWalletClients()
  const publicClient = await viem.getPublicClient()
  const deployment = await ignition.deploy(CompanyRegistryModule)

  return {
    ...deployment,
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
  const deployment = await ignition.deploy(SalaryCipherCoreModule)

  return {
    ...deployment,
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
export async function createDefaultCompanyFixture(options: CompanyFixtureOptions = {}) {
  const fixture = await deployCompanyRegistryFixture()
  const { companyRegistry, owner, publicClient } = fixture
  const asset = options.asset ?? SettlementAssetEnum.USDC

  const hash = await companyRegistry.write.createCompany(['Acme', 15, asset], {
    account: owner.account,
  })
  await publicClient.waitForTransactionReceipt({ hash })

  return { ...fixture, companyId: 1n, asset }
}

/**
 * Creates a default company, treasury vault, and optional local test liquidity.
 */
export async function createSalaryCipherCompanyFixture(options: CompanyFixtureOptions = {}) {
  const fixture = await deploySalaryCipherCoreFixture()
  const { companyRegistry, salaryCipherCore, owner, publicClient } = fixture
  const asset = options.asset ?? SettlementAssetEnum.USDC

  const createCompanyHash = await companyRegistry.write.createCompany(['Acme', 15, asset], {
    account: owner.account,
  })
  await publicClient.waitForTransactionReceipt({ hash: createCompanyHash })

  const companyId = 1n
  const { underlyingToken, settlementToken } = resolveAssetContracts(fixture, asset)
  const companyTreasuryVault = await viem.deployContract(
    'CompanyTreasuryVault',
    [
      companyId,
      companyRegistry.address,
      salaryCipherCore.address,
    ],
    { client: { wallet: owner } },
  )

  const authorizeCoreHash = await companyRegistry.write.setAuthorizedCaller(
    [companyId, salaryCipherCore.address, true],
    { account: owner.account },
  )
  await publicClient.waitForTransactionReceipt({ hash: authorizeCoreHash })

  const setTreasuryVaultHash = await companyRegistry.write.setTreasuryVault(
    [companyId, companyTreasuryVault.address],
    { account: owner.account },
  )
  await publicClient.waitForTransactionReceipt({ hash: setTreasuryVaultHash })

  if (!options.useSepoliaAssets) {
    const mintHash = await underlyingToken.write.mint([owner.account.address, 2_000_000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: mintHash })
  }

  return {
    ...fixture,
    companyId,
    asset,
    underlyingToken,
    settlementToken,
    companyTreasuryVault,
  }
}
