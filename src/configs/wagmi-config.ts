import type { AppKitNetwork } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { hardhat, sepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, hardhat]

export const wagmiConfig = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
})

createAppKit({
  adapters: [wagmiConfig],
  networks,
  projectId,
  enableWalletGuide: false,
  features: {
    connectorTypeOrder: ['recent', 'injected', 'recommended'],
    connectMethodsOrder: ['wallet'],
    walletFeaturesOrder: [],
    reownAuthentication: false,
    send: false,
    receive: false,
    collapseWallets: true,
    email: false,
    socials: false,
    swaps: false,
    analytics: false,
    onramp: false,
    pay: false,
  },
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX
    '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance
    '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Base
  ],
  themeVariables: {
    '--apkt-font-family': 'Arial',
  },
})
