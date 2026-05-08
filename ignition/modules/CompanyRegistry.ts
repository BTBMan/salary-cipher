import type { NamedArtifactContractDeploymentFuture } from '@nomicfoundation/ignition-core'
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { network } from 'hardhat'
import { SettlementAssetEnum } from '../../src/enums'

const MOCK_USDC_ID = 'MockUSDC'
const MOCK_USDT_ID = 'MockUSDT'
const MOCK_CUSDC_ID = 'MockCUSDC'
const MOCK_CUSDT_ID = 'MockCUSDT'
const LOCAL_TEST_TOKEN_BALANCE = 1_000_000_000_000n // 1,000,000 tokens with 6 decimals.
const LOCAL_TEST_ACCOUNT_COUNT = 3

const CompanyRegistryModule = buildModule('CompanyRegistryModule', (m) => {
  const companyRegistry = m.contract('CompanyRegistry', [], {})

  const networkConfig = network.config
  const isForkNetwork = network.name === 'hardhat' && Boolean((networkConfig as any).forking?.enabled)
  const isSepoliaNetwork = network.name === 'sepolia'
  const isLocalMockNetwork = network.name === 'localhost' || (network.name === 'hardhat' && !isForkNetwork)
  const isForkOrSepolia = isForkNetwork || isSepoliaNetwork

  let usdc!: NamedArtifactContractDeploymentFuture<'MockERC20'>
  let usdt!: NamedArtifactContractDeploymentFuture<'MockERC20'>
  let cUsdc!: NamedArtifactContractDeploymentFuture<'MockConfidentialERC20Wrapper'>
  let cUsdt!: NamedArtifactContractDeploymentFuture<'MockConfidentialERC20Wrapper'>

  if (isForkOrSepolia) {
    ;(usdc as any) = m.contractAt('MockERC20', '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF', { id: MOCK_USDC_ID, after: [companyRegistry] })
    ;(usdt as any) = m.contractAt('MockERC20', '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0', { id: MOCK_USDT_ID, after: [usdc] })
    ;(cUsdc as any) = m.contractAt('MockConfidentialERC20Wrapper', '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', { id: MOCK_CUSDC_ID, after: [usdt] })
    ;(cUsdt as any) = m.contractAt('MockConfidentialERC20Wrapper', '0x4E7B06D78965594eB5EF5414c357ca21E1554491', { id: MOCK_CUSDT_ID, after: [cUsdc] })
  }

  if (isLocalMockNetwork) {
    usdc = m.contract('MockERC20', ['Mock USD Coin', 'mUSDC', 6], { id: MOCK_USDC_ID, after: [companyRegistry] })
    usdt = m.contract('MockERC20', ['Mock Tether USD', 'mUSDT', 6], { id: MOCK_USDT_ID, after: [usdc] })
    cUsdc = m.contract('MockConfidentialERC20Wrapper', [usdc], { id: MOCK_CUSDC_ID, after: [usdt] })
    cUsdt = m.contract('MockConfidentialERC20Wrapper', [usdt], { id: MOCK_CUSDT_ID, after: [cUsdc] })

    for (let index = 0; index < LOCAL_TEST_ACCOUNT_COUNT; index++) {
      const account = m.getAccount(index)
      m.call(usdc, 'mint', [account, LOCAL_TEST_TOKEN_BALANCE], { id: `MintLocalUSDC${index}` })
      m.call(usdt, 'mint', [account, LOCAL_TEST_TOKEN_BALANCE], { id: `MintLocalUSDT${index}` })
    }
  }

  const setSupportedAssetCall = m.call(companyRegistry, 'setSupportedAsset', [SettlementAssetEnum.USDC, usdc!, cUsdc!, true, 6], { id: 'ConfigureUSDC', after: [cUsdt] })
  m.call(companyRegistry, 'setSupportedAsset', [SettlementAssetEnum.USDT, usdt!, cUsdt!, true, 6], { id: 'ConfigureUSDT', after: [setSupportedAssetCall] })

  return { companyRegistry, usdc, usdt, cUsdc, cUsdt }
})

export default CompanyRegistryModule
