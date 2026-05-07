import type { Address } from 'viem'

interface ContractDataWithAddresses {
  addresses: Record<number, Address>
}

export function getContractAddress(contractData: ContractDataWithAddresses, chainId: number | undefined) {
  if (!chainId) {
    return undefined
  }

  return contractData.addresses[chainId]
}
