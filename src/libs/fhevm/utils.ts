import type { EncryptResult } from './types'
import { toHex } from 'viem'

// Map external encrypted integer type to RelayerEncryptedInput builder method
export function getEncryptionMethod(internalType: string) {
  switch (internalType) {
    case 'externalEbool':
      return 'addBool' as const
    case 'externalEuint8':
      return 'add8' as const
    case 'externalEuint16':
      return 'add16' as const
    case 'externalEuint32':
      return 'add32' as const
    case 'externalEuint64':
      return 'add64' as const
    case 'externalEuint128':
      return 'add128' as const
    case 'externalEuint256':
      return 'add256' as const
    case 'externalEaddress':
      return 'addAddress' as const
    default:
      console.warn(`Unknown internalType: ${internalType}, defaulting to add64`)
      return 'add64' as const
  }
}

// Build contract params from EncryptResult and ABI for a given function
export function buildParamsFromAbi(enc: EncryptResult, abi: any[], functionName: string): any[] {
  const fn = abi.find((item: any) => item.type === 'function' && item.name === functionName)
  if (!fn)
    throw new Error(`Function ABI not found for ${functionName}`)

  return fn.inputs.map((input: any, index: number) => {
    const raw = index === 0 ? enc.handles[0] : enc.inputProof
    switch (input.type) {
      case 'bytes32':
      case 'bytes':
        return toHex(raw)
      case 'uint256':
        return BigInt(raw as unknown as string)
      case 'address':
      case 'string':
        return raw as unknown as string
      case 'bool':
        return Boolean(raw)
      default:
        console.warn(`Unknown ABI param type ${input.type}; passing as hex`)
        return toHex(raw)
    }
  })
}
