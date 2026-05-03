import type { Address } from 'viem'
import SalaryCipherFactoryArtifact from '../../artifacts/contracts/SalaryCipherFactory.sol/SalaryCipherFactory.json'
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

export const SalaryCipherFactory = {
  address: (deployedAddress as Record<string, string>)['SalaryCipherCoreModule#SalaryCipherFactory'] as Address,
  abi: SalaryCipherFactoryArtifact.abi as any,
} as const
