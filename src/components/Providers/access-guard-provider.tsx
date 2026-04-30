'use client'

import type { PropsWithChildren } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useConnection } from 'wagmi'
import { AUTH_ONLY_SETUP_PATHS, CREATE_COMPANY_PATH, ONBOARDING_PATHS, PUBLIC_PATHS } from '@/constants'
import { useStoreContext } from '@/hooks'

export function AccessGuardProvider({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected } = useConnection()
  const { hasCompanies, isReady, selectedCompanyId } = useStoreContext()

  useEffect(() => {
    if (!pathname || !isReady) {
      return
    }

    if (!isConnected) {
      if (!PUBLIC_PATHS.has(pathname)) {
        router.replace('/')
      }
      return
    }

    if (PUBLIC_PATHS.has(pathname)) {
      return
    }

    if (!hasCompanies && pathname !== CREATE_COMPANY_PATH) {
      router.replace(CREATE_COMPANY_PATH)
      return
    }

    if (hasCompanies && !AUTH_ONLY_SETUP_PATHS.has(pathname) && !selectedCompanyId) {
      router.replace(ONBOARDING_PATHS)
    }
  }, [hasCompanies, isConnected, isReady, pathname, router, selectedCompanyId])

  if (!isReady) {
    return null
  }

  if (!isConnected && !PUBLIC_PATHS.has(pathname)) {
    return null
  }

  if (isConnected && !hasCompanies && pathname !== CREATE_COMPANY_PATH) {
    return null
  }

  if (isConnected && hasCompanies && !AUTH_ONLY_SETUP_PATHS.has(pathname) && !selectedCompanyId && !PUBLIC_PATHS.has(pathname)) {
    return null
  }

  return children
}
