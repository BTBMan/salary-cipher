'use client'

import {
  MdUnfoldMore as UnfoldMoreIcon,
} from 'react-icons/md'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { WalletNetworkStatus } from '@/components/wallet/wallet-network-status'
import { RolesEnum } from '@/enums'
import { useStoreContext } from '@/hooks'

export function AppHeader() {
  const { selectedCompany } = useStoreContext()

  const roleTone: Record<RolesEnum, string> = {
    [RolesEnum.Owner]: 'bg-tertiary-container/20 text-tertiary',
    [RolesEnum.HR]: 'bg-primary-container/20 text-primary',
    [RolesEnum.Employee]: 'bg-surface-variant text-on-surface-variant',
    [RolesEnum.None]: '',
  } as const

  return (
    <header className="flex justify-between items-center px-6 py-3 w-full bg-[#131b2e]/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_40px_80px_-20px_rgba(6,14,32,0.5)] border-b border-white/5">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />

        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-sm border border-outline-variant/15 cursor-pointer hover:bg-surface-container-high transition-colors group">
          <div className="size-5 rounded-sm bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">
            {selectedCompany?.avatarSeed ?? 'C'}
          </div>
          <span className="text-on-surface font-heading font-semibold text-sm">{selectedCompany?.name ?? 'Company'}</span>
          {selectedCompany && (
            <Badge className={`${roleTone[selectedCompany.role]} text-[10px] font-bold rounded-sm uppercase tracking-tight border-none px-1.5 py-0.5`}>
              {selectedCompany.role}
            </Badge>
          )}
          <UnfoldMoreIcon className="text-outline text-lg group-hover:text-foreground transition-colors" />
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        <WalletNetworkStatus />
      </div>
    </header>
  )
}
