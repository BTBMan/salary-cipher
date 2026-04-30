'use client'

import { useRouter } from 'next/navigation'
import {
  MdGroups as GroupsIcon,
  MdAccountBalanceWallet as WalletIcon,
} from 'react-icons/md'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RolesEnum } from '@/enums'
import { useStoreContext } from '@/hooks'

const roleColorMap: Record<RolesEnum, string> = {
  [RolesEnum.Owner]: 'bg-tertiary-fixed text-on-tertiary-fixed',
  [RolesEnum.HR]: 'bg-primary-fixed text-on-primary-fixed',
  [RolesEnum.Employee]: 'bg-surface-variant text-on-surface-variant',
  [RolesEnum.None]: '',
} as const

export function CompanySelector() {
  const { companies, selectCompany } = useStoreContext()
  const router = useRouter()

  return (
    <div className="px-8 py-4 space-y-3">
      {companies.map(company => (
        <div
          key={company.id}
          className="group flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container-high transition-all duration-300 rounded-lg cursor-pointer border border-transparent hover:border-white/5"
        >
          <Avatar className="w-12 h-12 rounded-lg border border-white/10">
            <AvatarFallback className="bg-surface-container-highest text-primary font-bold">{company.avatarSeed}</AvatarFallback>
          </Avatar>
          <div className="grow">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading font-semibold text-on-surface text-lg">{company.name}</span>
              <Badge className={`${roleColorMap[company.role]} border-none text-[10px] font-bold tracking-wider uppercase rounded-sm px-2 py-0.5`}>
                {company.role}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
              <span className="flex items-center gap-1">
                <GroupsIcon className="size-3.5" /> {company.employeeCount} Employees
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <WalletIcon className="size-3.5" /> {company.wallet.slice(0, 6)}...{company.wallet.slice(-4)}
              </span>
            </div>
          </div>
          <Button
            className="bg-primary/10 hover:bg-primary text-primary hover:text-on-primary px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 border-none"
            onClick={() => {
              selectCompany(company.id)
              router.push('/dashboard')
            }}
          >
            Enter
          </Button>
        </div>
      ))}
    </div>
  )
}
