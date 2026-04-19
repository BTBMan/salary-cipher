import type { HardhatUserConfig } from 'hardhat/config'
import { vars } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox-viem'
import '@nomicfoundation/hardhat-verify'
import '@fhevm/hardhat-plugin'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

const SEPOLIA_RPC_URL = vars.get('SEPOLIA_RPC_URL')
const TEST_PRIVATE_KEY = vars.get('TEST_PRIVATE_KEY')
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY')
const COIN_MARKET_KEY = vars.get('COIN_MARKET_KEY', 'xx')

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [TEST_PRIVATE_KEY],
      chainId: 11155111,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  solidity: {
    version: '0.8.28',
    settings: {
      metadata: {
        bytecodeHash: 'none',
      },
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: 'cancun',
    },
  },
  gasReporter: {
    enabled: false,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
    coinmarketcap: COIN_MARKET_KEY,
    token: 'ETH',
    L1Etherscan: ETHERSCAN_API_KEY,
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  mocha: {
    timeout: '200000', // 200 seconds
  },
}

export default config
