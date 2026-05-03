'use client'

import type { RolesEnum, SettlementAssetEnum } from '@/enums'
import { createContext } from 'react'

export interface CreateCompanyInput {
  name: string
  // description: string
  payrollDayOfMonth: number
  settlementAsset: SettlementAssetEnum
}

export interface CompanySummary {
  createdAt: number
  id: string
  name: string
  description: string
  role: RolesEnum
  employeeCount: number
  wallet: string
  avatarSeed: string
  payrollDayOfMonth: number
  settlementAsset: SettlementAssetEnum
}

export interface SettlementAssetOption {
  value: SettlementAssetEnum
  label: string
  symbol: string
  decimals: number
  underlyingToken: string
  settlementToken: string
}

export interface StoreContextState {
  companies: CompanySummary[]
  hasCompanies: boolean
  selectedCompany: CompanySummary | null
  selectedCompanyId: string | null
  settlementAssets: SettlementAssetOption[]
  isReady: boolean
  isCreatingCompany: boolean
  createCompany: (input: CreateCompanyInput) => Promise<CompanySummary | null>
  selectCompany: (companyId: string) => void
  clearSelectedCompany: () => void
  refreshCompanies: () => Promise<void>
}

export const StoreContext = createContext<StoreContextState | undefined>(undefined)
