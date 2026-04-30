'use client'

import { use } from 'react'
import { StoreContext } from '@/contexts'

export function useStoreContext() {
  const context = use(StoreContext)

  if (!context) {
    throw new Error('useStoreContext must be used within an StoreProvider')
  }

  return context
}
