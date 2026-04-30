'use client'

import {
  MdUnfoldMore as UnfoldMoreIcon,
} from 'react-icons/md'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { WalletNetworkStatus } from '@/components/wallet/wallet-network-status'

export function AppHeader() {
  return (
    <header className="flex justify-between items-center px-6 py-3 w-full bg-[#131b2e]/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_40px_80px_-20px_rgba(6,14,32,0.5)] border-b border-white/5">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />

        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-sm border border-outline-variant/15 cursor-pointer hover:bg-surface-container-high transition-colors group">
          <img
            alt="Aura Labs Logo"
            className="size-5 rounded-sm"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8KLSlceWhY_x3ZA6wrO76jymBblR__ShMy_QX1iCKVAt0p9Vn6e5351MzbjTu_4KuKfGSx6mTXadJat_d6TTHkcovKTDb9wxA4TI1d_8KcAgGLMlPcegxiu-XH3vBKT9ADRy1uTmTpwfjYCOUSjd4TuZKZWTNmXUfiD062c4tHIp3gnPpTQvUAFDo75KG6NNoBk8gbfxRALqUFtEw0dd5AGZICn0ShL23ynJjkk3-E_SZP-znIXsedz2K1M6WOu5NI66gSiBG68Y"
          />
          <span className="text-on-surface font-heading font-semibold text-sm">Aura Labs</span>
          <Badge className="bg-tertiary-container/20 text-tertiary text-[10px] font-bold rounded-sm uppercase tracking-tight border-none px-1.5 py-0.5">
            Owner
          </Badge>
          <UnfoldMoreIcon className="text-outline text-lg group-hover:text-foreground transition-colors" />
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        <WalletNetworkStatus />
      </div>
    </header>
  )
}
