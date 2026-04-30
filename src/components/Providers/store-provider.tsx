'use client'

import type { CompanySummary, CreateCompanyInput } from '@/contexts'
import type { PropsWithChildren } from 'react'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { useConnection } from 'wagmi'
import { StoreContext } from '@/contexts'
import { RolesEnum } from '@/enums'

const STORAGE_KEY_PREFIX = 'salary-cipher'

function getCompaniesStorageKey(address: string) {
  return `${STORAGE_KEY_PREFIX}:companies:${address.toLowerCase()}`
}

function getSelectedCompanyStorageKey(address: string) {
  return `${STORAGE_KEY_PREFIX}:selected-company:${address.toLowerCase()}`
}

function readStoredCompanies(address: string) {
  const rawValue = window.localStorage.getItem(getCompaniesStorageKey(address))

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue) as CompanySummary[]
    return Array.isArray(parsedValue) ? parsedValue : []
  }
  catch {
    return []
  }
}

export function StoreProvider({ children }: PropsWithChildren) {
  const { address, isConnected, isConnecting } = useConnection()
  const [sessionState, setSessionState] = useState<{
    companies: CompanySummary[]
    selectedCompanyId: string | null
    isReady: boolean
  }>({
    companies: [],
    selectedCompanyId: null,
    isReady: false,
  })

  const { companies, selectedCompanyId, isReady } = sessionState

  useEffect(() => {
    if (!isConnected || !address) {
      startTransition(() => {
        setSessionState({
          companies: [],
          selectedCompanyId: null,
          isReady: !isConnecting,
        })
      })
      return
    }

    const nextCompanies = readStoredCompanies(address)
    const nextSelectedCompanyId = window.localStorage.getItem(getSelectedCompanyStorageKey(address))

    startTransition(() => {
      setSessionState({
        companies: nextCompanies,
        selectedCompanyId: nextCompanies.some(company => company.id === nextSelectedCompanyId) ? nextSelectedCompanyId : null,
        isReady: true,
      })
    })
  }, [address, isConnected, isConnecting])

  const selectedCompany = useMemo(() => {
    return companies.find(company => company.id === selectedCompanyId) ?? null
  }, [companies, selectedCompanyId])

  const contextValue = useMemo(() => {
    const persistCompanies = (nextCompanies: CompanySummary[]) => {
      if (!address) {
        return
      }

      window.localStorage.setItem(getCompaniesStorageKey(address), JSON.stringify(nextCompanies))
      setSessionState(prevState => ({
        ...prevState,
        companies: nextCompanies,
      }))
    }

    const persistSelectedCompany = (companyId: string | null) => {
      if (!address) {
        return
      }

      if (companyId) {
        window.localStorage.setItem(getSelectedCompanyStorageKey(address), companyId)
      }
      else {
        window.localStorage.removeItem(getSelectedCompanyStorageKey(address))
      }

      setSessionState(prevState => ({
        ...prevState,
        selectedCompanyId: companyId,
      }))
    }

    return {
      companies,
      hasCompanies: companies.length > 0,
      selectedCompany,
      selectedCompanyId,
      isReady,
      createCompany: (input: CreateCompanyInput) => {
        const normalizedName = input.name.trim()
        const normalizedDescription = input.description.trim()

        const company: CompanySummary = {
          id: crypto.randomUUID(),
          name: normalizedName,
          description: normalizedDescription,
          role: RolesEnum.Owner,
          employeeCount: 0,
          wallet: address ?? '',
          avatarSeed: normalizedName.charAt(0).toUpperCase() || 'C',
        }

        const nextCompanies = [...companies, company]
        persistCompanies(nextCompanies)
        // Creating a company only adds it to the list. The user still has to enter via the selector.
        persistSelectedCompany(null)

        return company
      },
      selectCompany: (companyId: string) => {
        persistSelectedCompany(companyId)
      },
      clearSelectedCompany: () => {
        persistSelectedCompany(null)
      },
    }
  }, [address, companies, isReady, selectedCompany, selectedCompanyId])

  return (
    <StoreContext value={contextValue}>
      {children}
    </StoreContext>
  )
}
