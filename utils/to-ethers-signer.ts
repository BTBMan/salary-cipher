import type { WalletClient } from 'viem'
import { ethers } from 'ethers'

export function toEthersSigner(walletClient: WalletClient) {
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

  const provider = ethersProvider()
  const address = walletClient.account?.address

  if (!provider || !address)
    return undefined

  return new ethers.JsonRpcSigner(provider, address)
}
