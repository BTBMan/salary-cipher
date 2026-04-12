import { Contract, JsonRpcProvider } from 'ethers'
import { MockFhevmInstance } from '@fhevm/mock-utils'
import type { FhevmInstance } from '../../types'

const EIP712_DOMAIN_ABI = [
  'function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)',
]

async function getEip712Domain(provider: JsonRpcProvider, contractAddress: string): Promise<{
  chainId: number
  verifyingContract: string
}> {
  const contract = new Contract(contractAddress, EIP712_DOMAIN_ABI, provider)
  const domain = await contract.eip712Domain()
  return {
    chainId: Number(domain[3]),
    verifyingContract: domain[4] as string,
  }
}

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string
  chainId: number
  metadata: {
    ACLAddress: `0x${string}`
    InputVerifierAddress: `0x${string}`
    KMSVerifierAddress: `0x${string}`
  }
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl)
  const [kmsVerifierDomain, inputVerifierDomain] = await Promise.all([
    getEip712Domain(provider, parameters.metadata.KMSVerifierAddress),
    getEip712Domain(provider, parameters.metadata.InputVerifierAddress),
  ])

  const instance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: kmsVerifierDomain.chainId,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption: kmsVerifierDomain.verifyingContract as `0x${string}`,
    verifyingContractAddressInputVerification: inputVerifierDomain.verifyingContract as `0x${string}`,
  }, {
    kmsVerifierProperties: {},
    inputVerifierProperties: {},
  })

  return instance as unknown as FhevmInstance
}
