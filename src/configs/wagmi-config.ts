import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { hardhat, sepolia } from 'viem/chains'
import { http } from 'wagmi'
import '@rainbow-me/rainbowkit/styles.css'

export const wagmiConfig = getDefaultConfig({
  appName: 'salary-cipher',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
      ],
    },
  ],
  ssr: true,
  chains: [
    sepolia,
    hardhat,
  ],
  transports: {
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
})
