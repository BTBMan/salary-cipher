import type { FhevmInstance as _FhevmInstance, FhevmInstanceConfig as _FhevmInstanceConfig, HandleContractPair as _HandleContractPair, UserDecryptResults as _UserDecryptResults } from '@zama-fhe/relayer-sdk/bundle'

export type FhevmInstance = _FhevmInstance
export type FhevmInstanceConfig = _FhevmInstanceConfig
export type HandleContractPair = _HandleContractPair
export type UserDecryptResults = _UserDecryptResults

export interface FhevmDecryptionSignatureType {
  publicKey: string
  privateKey: string
  signature: string
  startTimestamp: number // Unix timestamp in seconds
  durationDays: number
  userAddress: `0x${string}`
  contractAddresses: `0x${string}`[]
  eip712: EIP712Type
}

export interface EIP712Type {
  domain: {
    chainId: number
    name: string
    verifyingContract: `0x${string}`
    version: string
  }

  message: any
  primaryType: string
  types: {
    [key: string]: {
      name: string
      type: string
    }[]
  }
}

export interface FhevmInitSDKOptions {
  tfheParams?: any
  kmsParams?: any
  thread?: number
}

export type FhevmCreateInstanceType = () => Promise<FhevmInstance>
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>
export type FhevmLoadSDKType = () => Promise<void>

export interface FhevmRelayerSDKType {
  initSDK: FhevmInitSDKType
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>
  SepoliaConfig: FhevmInstanceConfig
  __initialized__?: boolean
}

export interface FhevmWindowType {
  relayerSDK: FhevmRelayerSDKType
}

export interface EncryptResult {
  handles: Uint8Array[]
  inputProof: Uint8Array
}
