'use client'

import type { RolesEnum } from '@/enums'
import { createContext } from 'react'

export interface CreateCompanyInput {
  name: string
  description: string
}

export interface CompanySummary {
  id: string
  name: string
  description: string
  // role: 'Owner' | 'HR' | 'Employee'
  role: RolesEnum
  employeeCount: number
  wallet: string
  avatarSeed: string
}

export interface StoreContextState {
  companies: CompanySummary[]
  hasCompanies: boolean
  selectedCompany: CompanySummary | null
  selectedCompanyId: string | null
  isReady: boolean
  createCompany: (input: CreateCompanyInput) => CompanySummary
  selectCompany: (companyId: string) => void
  clearSelectedCompany: () => void
}

export const StoreContext = createContext<StoreContextState | undefined>(undefined)
