import { use } from 'react'
import { FhevmContext } from '@/contexts'

export function useFhevmContext() {
  const context = use(FhevmContext)
  if (!context) {
    throw new Error('useFhevmContext must be used within a FhevmContext')
  }

  return context
}
