import type { Address } from 'viem'
import SalaryNegotiationArtifact from '../../artifacts/contracts/SalaryNegotiation.sol/SalaryNegotiation.json'
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

const deployedAddresses = deployedAddress as Record<string, string | undefined>

export const SalaryNegotiation = {
  address: deployedAddresses['SalaryCipherCoreModule#SalaryNegotiation'] as Address | undefined,
  abi: SalaryNegotiationArtifact.abi as any,
} as const
