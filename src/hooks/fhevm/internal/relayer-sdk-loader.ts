import type { FhevmRelayerSDKType, FhevmWindowType } from './fhevm-types'
import { SDK_CDN_URL } from './constants'

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void

export class RelayerSDKLoader {
  private trace?: TraceType

  constructor(options: { trace?: TraceType }) {
    this.trace = options.trace
  }

  public load(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('RelayerSDKLoader: can only be used in the browser.'))
    }

    if ('relayerSDK' in window) {
      if (!isFhevmRelayerSDKType(window.relayerSDK, this.trace)) {
        throw new Error('RelayerSDKLoader: Unable to load FHEVM Relayer SDK')
      }
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${SDK_CDN_URL}"]`)
      if (existingScript) {
        if (!isFhevmWindowType(window, this.trace)) {
          reject(new Error('RelayerSDKLoader: window object does not contain a valid relayerSDK object.'))
          return
        }
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = SDK_CDN_URL
      script.type = 'text/javascript'
      script.async = true

      script.onload = () => {
        if (!isFhevmWindowType(window, this.trace)) {
          reject(new Error(`RelayerSDKLoader: Relayer SDK script loaded from ${SDK_CDN_URL}, but window.relayerSDK is invalid.`))
          return
        }
        resolve()
      }

      script.onerror = () => {
        reject(new Error(`RelayerSDKLoader: Failed to load Relayer SDK from ${SDK_CDN_URL}`))
      }

      document.head.appendChild(script)
    })
  }
}

function isFhevmRelayerSDKType(o: unknown, trace?: TraceType): o is FhevmRelayerSDKType {
  if (typeof o === 'undefined' || o === null || typeof o !== 'object') {
    trace?.('RelayerSDKLoader: relayerSDK is invalid')
    return false
  }
  if (!objHasProperty(o, 'initSDK', 'function', trace))
    return false
  if (!objHasProperty(o, 'createInstance', 'function', trace))
    return false
  if (!objHasProperty(o, 'SepoliaConfig', 'object', trace))
    return false
  if ('__initialized__' in o && o.__initialized__ !== true && o.__initialized__ !== false)
    return false
  return true
}

export function isFhevmWindowType(win: unknown, trace?: TraceType): win is FhevmWindowType {
  if (typeof win === 'undefined' || win === null || typeof win !== 'object') {
    trace?.('RelayerSDKLoader: window object is invalid')
    return false
  }
  if (!('relayerSDK' in win)) {
    trace?.('RelayerSDKLoader: window does not contain relayerSDK')
    return false
  }
  return isFhevmRelayerSDKType(win.relayerSDK, trace)
}

function objHasProperty<T extends object, K extends PropertyKey, V extends string>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: TraceType,
): obj is T & Record<K, unknown> {
  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`)
    return false
  }

  const value = (obj as Record<K, unknown>)[propertyName]
  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`)
    return false
  }
  if (typeof value !== propertyType) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`)
    return false
  }
  return true
}
