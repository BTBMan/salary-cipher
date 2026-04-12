type FhevmStoredPublicKey = {
  publicKeyId: string
  publicKey: Uint8Array
}

type FhevmStoredPublicParams = {
  publicParamsId: string
  publicParams: Uint8Array
}

type FhevmPublicKeyType = {
  data: Uint8Array
  id: string
}

type FhevmPkeCrsType = {
  publicParams: Uint8Array
  publicParamsId: string
}

type FhevmPkeCrsByCapacityType = {
  2048: FhevmPkeCrsType
}

const publicKeyStoreKey = (aclAddress: `0x${string}`) => `fhevm:publicKey:${aclAddress}`
const publicParamsStoreKey = (aclAddress: `0x${string}`) => `fhevm:publicParams:${aclAddress}`

function encode(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function decode(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: FhevmPublicKeyType
  publicParams?: FhevmPkeCrsByCapacityType
}> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawPublicKey = window.localStorage.getItem(publicKeyStoreKey(aclAddress))
    const rawPublicParams = window.localStorage.getItem(publicParamsStoreKey(aclAddress))
    const result: {
      publicKey?: FhevmPublicKeyType
      publicParams?: FhevmPkeCrsByCapacityType
    } = {}

    if (rawPublicKey) {
      const parsed = JSON.parse(rawPublicKey) as { id: string, data: string }
      result.publicKey = {
        id: parsed.id,
        data: decode(parsed.data),
      }
    }

    if (rawPublicParams) {
      const parsed = JSON.parse(rawPublicParams) as { publicParamsId: string, publicParams: string }
      result.publicParams = {
        2048: {
          publicParamsId: parsed.publicParamsId,
          publicParams: decode(parsed.publicParams),
        },
      }
    }

    return result
  }
  catch {
    return {}
  }
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: FhevmStoredPublicKey | null,
  publicParams: FhevmStoredPublicParams | null,
) {
  if (typeof window === 'undefined') {
    return
  }

  if (publicKey) {
    window.localStorage.setItem(publicKeyStoreKey(aclAddress), JSON.stringify({
      id: publicKey.publicKeyId,
      data: encode(publicKey.publicKey),
    }))
  }

  if (publicParams) {
    window.localStorage.setItem(publicParamsStoreKey(aclAddress), JSON.stringify({
      publicParamsId: publicParams.publicParamsId,
      publicParams: encode(publicParams.publicParams),
    }))
  }
}
