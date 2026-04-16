import type { WalletClient } from 'viem'
import { ethers } from 'ethers'

export function ethersWrapper(walletClient?: WalletClient, initialMockChains?: Readonly<Record<number, string>>) {
  const ethersProvider = () => {
    if (!walletClient)
      return undefined

    const eip1193Provider = {
      request: async (args: any) => {
        return await walletClient.request(args)
      },
      on: () => {
        console.warn('Provider events not fully implemented for viem')
      },
      removeListener: () => {
        console.warn('Provider removeListener not fully implemented for viem')
      },
    } as ethers.Eip1193Provider

    return new ethers.BrowserProvider(eip1193Provider)
  }

  const ethersReadonlyProvider = () => {
    const chainId = walletClient?.chain?.id

    if (!ethersProvider)
      return undefined

    const rpcUrl = initialMockChains?.[chainId || 0]
    if (rpcUrl) {
      return new ethers.JsonRpcProvider(rpcUrl)
    }

    return ethersProvider()
  }

  const ethersSigner = () => {
    const address = walletClient?.account?.address
    const provider = ethersProvider()

    if (!provider || !address)
      return undefined
    return new ethers.JsonRpcSigner(provider, address)
  }

  return {
    ethersProvider,
    ethersReadonlyProvider,
    ethersSigner,
  }
}
