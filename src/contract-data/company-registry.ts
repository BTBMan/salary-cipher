import type { Address } from 'viem'
import Artifact from '../../ignition/deployments/chain-31337/artifacts/CompanyRegistryModule#CompanyRegistry.json';
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

export const CompanyRegistry = {
  address: deployedAddress['CompanyRegistryModule#CompanyRegistry'] as Address,
  abi: Artifact.abi as any,
} as const
