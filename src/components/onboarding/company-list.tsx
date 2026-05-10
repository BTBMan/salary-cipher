'use client'

import type { CompanySummary } from '@/contexts'
import {
  MdGroups as GroupsIcon,
  MdAccountBalanceWallet as WalletIcon,
} from 'react-icons/md'
import { RoleBadge } from '@/components/role-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatAddress } from '@/utils'

interface CompanyListProps {
  companies: CompanySummary[]
  selectedCompanyId: string | null
  onSelect: (companyId: string) => void
}

/**
 * Shared company list used by onboarding and the workspace switcher dialog.
 */
export function CompanyList({ companies, onSelect, selectedCompanyId }: CompanyListProps) {
  return (
    <div className="space-y-3">
      {companies.map(company => (
        <div
          key={company.id}
          className={`group flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ${
            company.id === selectedCompanyId
              ? 'border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(192,193,255,0.15)]'
              : 'border-transparent bg-surface-container-low hover:border-white/5 hover:bg-surface-container-high'
          }`}
        >
          <Avatar className="h-12 w-12 rounded-lg border border-white/10">
            <AvatarFallback className="bg-surface-container-highest font-bold text-primary">{company.avatarSeed}</AvatarFallback>
          </Avatar>
          <div className="grow">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-heading text-lg font-semibold text-on-surface">{company.name}</span>
              {company.id === selectedCompanyId && (
                <span className="rounded-sm border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Current
                </span>
              )}
              <RoleBadge role={company.role} className="rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wider" />
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant">
              <span className="flex items-center gap-1">
                <GroupsIcon className="size-3.5" /> {company.employeeCount} Employees
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <WalletIcon className="size-3.5" /> {formatAddress(company.wallet)}
              </span>
            </div>
          </div>
          {company.id !== selectedCompanyId && (
            <button
              className="rounded-lg border-none bg-primary/10 px-5 py-2 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-on-primary"
              type="button"
              onClick={() => onSelect(company.id)}
            >
              Enter
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
