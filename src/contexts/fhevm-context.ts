import type { GenericStringStorage } from '@/libs/fhevm'
import { createContext } from 'react'

export interface FhevmContextState {
  storage: GenericStringStorage
}

export const FhevmContext = createContext<FhevmContextState | undefined>(undefined)
