'use client'

import type { RolesEnum, SettlementAssetEnum } from '@/enums'
import type { Address } from 'viem'
import { createContext } from 'react'

export interface CreateCompanyInput {
  name: string
  // description: string
  payrollDayOfMonth: number
  settlementAsset: SettlementAssetEnum
}

export interface CompanySummary {
  createdAt: number
  createdBlockNumber: bigint
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
  settlementToken: Address
}

export type WorkspaceViewMode = 'company' | 'employee'

export interface StoreContextState {
  companies: CompanySummary[]
  hasCompanies: boolean
  selectedCompany: CompanySummary | null
  selectedCompanyId: string | null
  settlementAssets: SettlementAssetOption[]
  workspaceViewMode: WorkspaceViewMode
  canSwitchWorkspaceView: boolean
  isReady: boolean
  isCreatingCompany: boolean
  setWorkspaceViewMode: (mode: WorkspaceViewMode) => void
  createCompany: (input: CreateCompanyInput) => Promise<CompanySummary | null>
  selectCompany: (companyId: string) => void
  clearSelectedCompany: () => void
  refreshCompanies: () => Promise<void>
}

export const StoreContext = createContext<StoreContextState | undefined>(undefined)
