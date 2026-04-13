import { TypedDataEncoder, isAddress, ZeroAddress, type JsonRpcSigner } from 'ethers'
import type { GenericStringStorage } from './storage'
import type { FhevmInstance } from './types'

type EIP712Type = {
  domain: {
    chainId: number
    name: string
    verifyingContract: `0x${string}`
    version: string
  }
  message: any
  primaryType: string
  types: Record<string, Array<{ name: string, type: string }>>
}

type FhevmDecryptionSignatureType = {
  publicKey: string
  privateKey: string
  signature: string
  startTimestamp: number
  durationDays: number
  userAddress: `0x${string}`
  contractAddresses: `0x${string}`[]
  eip712: EIP712Type
}

function timestampNow() {
  return Math.floor(Date.now() / 1000)
}

class FhevmDecryptionSignatureStorageKey {
  #key: string

  constructor(instance: FhevmInstance, contractAddresses: string[], userAddress: string, publicKey?: string) {
    if (!isAddress(userAddress)) {
      throw new TypeError(`Invalid address ${userAddress}`)
    }

    const sortedContractAddresses = [...contractAddresses].sort() as `0x${string}`[]
    const emptyEip712 = (instance as any).createEIP712(publicKey ?? ZeroAddress, sortedContractAddresses, 0, 0)
    const hash = TypedDataEncoder.hash(
      emptyEip712.domain,
      { UserDecryptRequestVerification: emptyEip712.types.UserDecryptRequestVerification },
      emptyEip712.message,
    )

    this.#key = `${userAddress}:${hash}`
  }

  get key() {
    return this.#key
  }
}

export class FhevmDecryptionSignature {
  #publicKey: string
  #privateKey: string
  #signature: string
  #startTimestamp: number
  #durationDays: number
  #userAddress: `0x${string}`
  #contractAddresses: `0x${string}`[]
  #eip712: EIP712Type

  private constructor(parameters: FhevmDecryptionSignatureType) {
    this.#publicKey = parameters.publicKey
    this.#privateKey = parameters.privateKey
    this.#signature = parameters.signature
    this.#startTimestamp = parameters.startTimestamp
    this.#durationDays = parameters.durationDays
    this.#userAddress = parameters.userAddress
    this.#contractAddresses = parameters.contractAddresses
    this.#eip712 = parameters.eip712
  }

  get privateKey() {
    return this.#privateKey
  }

  get publicKey() {
    return this.#publicKey
  }

  get signature() {
    return this.#signature
  }

  get contractAddresses() {
    return this.#contractAddresses
  }

  get startTimestamp() {
    return this.#startTimestamp
  }

  get durationDays() {
    return this.#durationDays
  }

  get userAddress() {
    return this.#userAddress
  }

  toJSON() {
    return {
      publicKey: this.#publicKey,
      privateKey: this.#privateKey,
      signature: this.#signature,
      startTimestamp: this.#startTimestamp,
      durationDays: this.#durationDays,
      userAddress: this.#userAddress,
      contractAddresses: this.#contractAddresses,
      eip712: this.#eip712,
    }
  }

  isValid() {
    return timestampNow() < this.#startTimestamp + this.#durationDays * 24 * 60 * 60
  }

  async saveToGenericStringStorage(storage: GenericStringStorage, instance: FhevmInstance, withPublicKey: boolean) {
    const storageKey = new FhevmDecryptionSignatureStorageKey(
      instance,
      this.#contractAddresses,
      this.#userAddress,
      withPublicKey ? this.#publicKey : undefined,
    )
    await storage.setItem(storageKey.key, JSON.stringify(this, (_, value) => (
      typeof value === 'bigint' ? value.toString() : value
    )))
  }

  static fromJSON(json: unknown) {
    const data = typeof json === 'string' ? JSON.parse(json) : json
    return new FhevmDecryptionSignature(data as FhevmDecryptionSignatureType)
  }

  static async loadFromGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string,
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const storageKey = new FhevmDecryptionSignatureStorageKey(instance, contractAddresses, userAddress, publicKey)
      const result = await storage.getItem(storageKey.key)
      if (!result) {
        return null
      }
      const signature = FhevmDecryptionSignature.fromJSON(result)
      return signature.isValid() ? signature : null
    }
    catch {
      return null
    }
  }

  static async create(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: JsonRpcSigner,
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = await signer.getAddress() as `0x${string}`
      const startTimestamp = timestampNow()
      const durationDays = 365
      const eip712 = (instance as any).createEIP712(publicKey, contractAddresses, startTimestamp, durationDays)
      const signature = await (signer as any).signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      )

      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      })
    }
    catch {
      return null
    }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: JsonRpcSigner,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string, privateKey: string },
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = await signer.getAddress() as `0x${string}`
    const cached = await FhevmDecryptionSignature.loadFromGenericStringStorage(
      storage,
      instance,
      contractAddresses,
      userAddress,
      keyPair?.publicKey,
    )

    if (cached) {
      return cached
    }

    const { publicKey, privateKey } = keyPair ?? (instance as any).generateKeypair()
    const signature = await FhevmDecryptionSignature.create(instance, contractAddresses, publicKey, privateKey, signer)
    if (!signature) {
      return null
    }

    await signature.saveToGenericStringStorage(storage, instance, Boolean(keyPair?.publicKey))
    return signature
  }
}
