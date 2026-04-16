import type { FhevmGoState } from '@/hooks'
import type { FhevmInstance, GenericStringStorage } from '@/libs/fhevm'
import { createContext } from 'react'

export interface FHEContextState {
  storage: GenericStringStorage
  instance: FhevmInstance | undefined
  refresh: () => void
  error: Error | undefined
  status: FhevmGoState
}

export const FHEContext = createContext<FHEContextState | undefined>(undefined)
