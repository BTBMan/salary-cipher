'use client'

import type { PropsWithChildren } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useConnection } from 'wagmi'
import { AUTH_ONLY_SETUP_PATHS, canAccessRoute, CREATE_COMPANY_PATH, LEGACY_OVERVIEW_PATHS, ONBOARDING_PATHS, OVERVIEW_PATH, PUBLIC_PATHS, ROOT_PATH } from '@/constants'
import { useStoreContext } from '@/hooks'

export function AccessGuardProvider({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected } = useConnection()
  const { hasCompanies, isReady, selectedCompany, selectedCompanyId } = useStoreContext()
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
      return
    }

    if (LEGACY_OVERVIEW_PATHS.has(pathname)) {
      router.replace(OVERVIEW_PATH)
      return
    }

    if (selectedCompany && !canAccessRoute(selectedCompany.role, pathname)) {
      router.replace(OVERVIEW_PATH)
    }
  }, [hasCompanies, isConnected, isPublicPath, isReady, pathname, router, selectedCompany, selectedCompanyId])

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

  if (pathname && LEGACY_OVERVIEW_PATHS.has(pathname)) {
    return null
  }

  if (selectedCompany && !canAccessRoute(selectedCompany.role, pathname)) {
    return null
  }

  return children
}
