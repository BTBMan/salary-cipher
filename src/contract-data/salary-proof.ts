import type { Address } from 'viem'
import SalaryProofArtifact from '../../artifacts/contracts/SalaryProof.sol/SalaryProof.json'
import deployedAddress from '../../ignition/deployments/chain-31337/deployed_addresses.json'

const deployedAddresses = deployedAddress as Record<string, string | undefined>

export const SalaryProof = {
  address: deployedAddresses['SalaryCipherCoreModule#SalaryProof'] as Address | undefined,
  abi: SalaryProofArtifact.abi as any,
} as const
