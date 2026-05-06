import type { Address } from 'viem'
import ProofNFTArtifact from '../../artifacts/contracts/ProofNFT.sol/ProofNFT.json'
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

const deployedAddresses = deployedAddress as Record<string, string | undefined>

export const ProofNFT = {
  address: deployedAddresses['SalaryCipherCoreModule#ProofNFT'] as Address | undefined,
  abi: ProofNFTArtifact.abi as any,
} as const
