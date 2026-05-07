import type { GenericStringStorage } from '@/libs/fhevm'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { FHEContext } from '@/contexts'
import { useFHEInstance } from '@/hooks'
import { GenericStringInMemoryStorage } from '@/libs/fhevm'

export function FheProvider({ children }: PropsWithChildren) {
  const [storage] = useState<GenericStringStorage>(() => new GenericStringInMemoryStorage())
  const instanceData = useFHEInstance()

  return (
    <FHEContext value={{ storage, ...instanceData }}>{children}</FHEContext>
  )
}
