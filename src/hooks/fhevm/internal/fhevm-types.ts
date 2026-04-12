import type { FhevmInstance, FhevmInstanceConfig } from '../types'

export type FhevmInitSDKOptions = {
  tfheParams?: any
  kmsParams?: any
  thread?: number
}

export type FhevmCreateInstanceType = () => Promise<FhevmInstance>
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>
export type FhevmLoadSDKType = () => Promise<void>

export type FhevmRelayerSDKType = {
  initSDK: FhevmInitSDKType
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>
  SepoliaConfig: FhevmInstanceConfig
  __initialized__?: boolean
}

export type FhevmWindowType = {
  relayerSDK: FhevmRelayerSDKType
}
