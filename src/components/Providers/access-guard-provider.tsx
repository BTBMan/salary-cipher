'use client'

import type { PropsWithChildren } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useConnection } from 'wagmi'
import { AUTH_ONLY_SETUP_PATHS, CREATE_COMPANY_PATH, ONBOARDING_PATHS, PUBLIC_PATHS, ROOT_PATH } from '@/constants'
import { useStoreContext } from '@/hooks'

export function AccessGuardProvider({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected } = useConnection()
  const { hasCompanies, isReady, selectedCompanyId } = useStoreContext()
  const isPublicPath = pathname ? PUBLIC_PATHS.has(pathname) : false

  useEffect(() => {
    if (!pathname) {
      return
    }

    if (isPublicPath) {
      return
    }

    if (!isReady) {
      return
    }

    if (!isConnected) {
      router.replace(ROOT_PATH)
      return
    }

    if (!hasCompanies && pathname !== CREATE_COMPANY_PATH) {
      router.replace(CREATE_COMPANY_PATH)
      return
    }

    if (hasCompanies && !AUTH_ONLY_SETUP_PATHS.has(pathname) && !selectedCompanyId) {
      router.replace(ONBOARDING_PATHS)
    }
  }, [hasCompanies, isConnected, isPublicPath, isReady, pathname, router, selectedCompanyId])

  if (isPublicPath) {
    return children
  }

  if (!isReady) {
    return null
  }

  if (!isConnected) {
    return null
  }

  if (!hasCompanies && pathname !== CREATE_COMPANY_PATH) {
    return null
  }

  if (hasCompanies && !AUTH_ONLY_SETUP_PATHS.has(pathname) && !selectedCompanyId) {
    return null
  }

  return children
}
