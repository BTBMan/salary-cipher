import { use } from 'react'
import { FHEContext } from '@/contexts'

export function useFHEContext() {
  const context = use(FHEContext)
  if (!context) {
    throw new Error('useFhevmContext must be used within a FhevmContext')
  }

  return context
}
