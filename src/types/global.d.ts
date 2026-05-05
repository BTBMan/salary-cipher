declare global {
  type Nullable<T> = null | undefined | T

  namespace NodeJS {
    interface ProcessEnv {
      // WalletConnect
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string

      // CoinMarketCap
      COIN_MARKET_KEY: string

      // Pinata
      PINATA_JWT: string
      NEXT_PUBLIC_GATEWAY_URL: string

      // Contract
      LOCAL_PRIVATE_KEY: string
      LOCAL_RPC_URL: string
      TEST_PRIVATE_KEY: string
      TEST_PRIVATE_KEY2: string
      SEPOLIA_RPC_URL: string
      ETHERSCAN_API_KEY: string
      NEXT_PUBLIC_COMPANY_REGISTRY_ADDRESS_HARDHAT?: string
      NEXT_PUBLIC_COMPANY_REGISTRY_ADDRESS_SEPOLIA?: string
    }
  }

  interface NFTMetadata {
    name: string
    description: string
    image: string
    attributes?: Record<string, any>[]
  }
}

export {}
