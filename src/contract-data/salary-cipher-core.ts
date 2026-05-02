import type { Address } from 'viem'
import SalaryCipherCoreArtifact from '../../ignition/deployments/chain-31337/artifacts/SalaryCipherCoreModule#SalaryCipherCore.json'
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

export const SalaryCipherCore = {
  address: deployedAddress['SalaryCipherCoreModule#SalaryCipherCore'] as Address,
  abi: SalaryCipherCoreArtifact.abi as any,
} as const
