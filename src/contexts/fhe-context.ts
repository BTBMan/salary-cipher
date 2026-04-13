import type { GenericStringStorage } from '@/libs/fhevm'
import { createContext } from 'react'

export interface FHEContextState {
  storage: GenericStringStorage
}

export const FHEContext = createContext<FHEContextState | undefined>(undefined)
