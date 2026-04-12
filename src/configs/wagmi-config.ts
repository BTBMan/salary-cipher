import type { AppKitNetwork } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { hardhat, sepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { http } from 'wagmi'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, hardhat]

export const wagmiConfig = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  transports: {
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
})

createAppKit({
  adapters: [wagmiConfig],
  networks,
  projectId,
  features: {
    connectorTypeOrder: ['recent', 'injected', 'recommended'],
    connectMethodsOrder: ['wallet'],
    email: false,
    socials: false,
    swaps: false,
    analytics: false,
  },
})
