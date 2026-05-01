import type { Abi, Address } from 'viem'
import CompanyRegistryArtifact from '../../ignition/deployments/chain-31337/artifacts/CompanyRegistryModule#CompanyRegistry.json'
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

export const CompanyRegistry = {
  address: deployedAddress['CompanyRegistryModule#CompanyRegistry'] as Address,
  abi: CompanyRegistryArtifact.abi
} as const