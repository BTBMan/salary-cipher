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

  let usdc = m.contract('MockERC20', ['Mock USD Coin', 'mUSDC', 6], { id: MOCK_USDC_ID })
  let usdt = m.contract('MockERC20', ['Mock Tether USD', 'mUSDT', 6], { id: MOCK_USDT_ID })
  let cUsdc = m.contract('MockConfidentialERC20Wrapper', [usdc], { id: MOCK_CUSDC_ID })
  let cUsdt = m.contract('MockConfidentialERC20Wrapper', [usdt], { id: MOCK_CUSDT_ID })

  const networkConfig = network.config
  const isForkOrSepolia = (networkConfig.chainId === 31337 && (networkConfig as any).forking?.enabled) || networkConfig.chainId === 11155111
  const isLocalMockNetwork = !isForkOrSepolia && (network.name === 'localhost' || networkConfig.chainId === 31337)

  if (isForkOrSepolia) {
    ;(usdc as any) = m.contractAt('MockERC20', '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF', { id: MOCK_USDC_ID })
    ;(usdt as any) = m.contractAt('MockERC20', '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0', { id: MOCK_USDT_ID })
    ;(cUsdc as any) = m.contractAt('MockConfidentialERC20Wrapper', '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', { id: MOCK_CUSDC_ID })
    ;(cUsdt as any) = m.contractAt('MockConfidentialERC20Wrapper', '0x4E7B06D78965594eB5EF5414c357ca21E1554491', { id: MOCK_CUSDT_ID })
  }

  if (isLocalMockNetwork) {
    for (let index = 0; index < LOCAL_TEST_ACCOUNT_COUNT; index++) {
      const account = m.getAccount(index)
      m.call(usdc, 'mint', [account, LOCAL_TEST_TOKEN_BALANCE], { id: `MintLocalUSDC${index}` })
      m.call(usdt, 'mint', [account, LOCAL_TEST_TOKEN_BALANCE], { id: `MintLocalUSDT${index}` })
    }
  }

  m.call(companyRegistry, 'setSupportedAsset', [SettlementAssetEnum.USDC, usdc, cUsdc, true, 6], { id: 'ConfigureUSDC' })
  m.call(companyRegistry, 'setSupportedAsset', [SettlementAssetEnum.USDT, usdt, cUsdt, true, 6], { id: 'ConfigureUSDT' })

  return { companyRegistry, usdc, usdt, cUsdc, cUsdt }
})

export default CompanyRegistryModule
