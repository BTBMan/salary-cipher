'use client'

import { useConnection } from 'wagmi'
import {
  AccountBalanceWalletIcon,
  HubIcon,
  UnfoldMoreIcon,
} from '@/components/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function AppHeader() {
  const { address } = useConnection()

  return (
    <header className="flex justify-between items-center px-6 py-3 w-full bg-[#131b2e]/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_40px_80px_-20px_rgba(6,14,32,0.5)] border-b border-white/5">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />

        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-sm border border-white/10 cursor-pointer hover:bg-surface-container-high transition-colors group">
          <img
            alt="Aura Labs Logo"
            className="w-5 h-5 rounded-sm"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8KLSlceWhY_x3ZA6wrO76jymBblR__ShMy_QX1iCKVAt0p9Vn6e5351MzbjTu_4KuKfGSx6mTXadJat_d6TTHkcovKTDb9wxA4TI1d_8KcAgGLMlPcegxiu-XH3vBKT9ADRy1uTmTpwfjYCOUSjd4TuZKZWTNmXUfiD062c4tHIp3gnPpTQvUAFDo75KG6NNoBk8gbfxRALqUFtEw0dd5AGZICn0ShL23ynJjkk3-E_SZP-znIXsedz2K1M6WOu5NI66gSiBG68Y"
          />
          <span className="text-on-surface font-heading font-semibold text-sm">Aura Labs</span>
          <Badge className="bg-tertiary-container/20 text-tertiary text-[10px] font-bold rounded-sm uppercase tracking-tighter border-none px-1.5 py-0.5">
            Owner
          </Badge>
          <UnfoldMoreIcon className="text-outline text-lg group-hover:text-foreground transition-colors" />
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block" />

        {/* Network Status */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#c0c1ff]" />
          <span>Ethereum Mainnet</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Wallet Address Pill */}
        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
          <span className="font-mono text-xs text-on-surface">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x71C...4921'}
          </span>
          <Avatar className="w-6 h-6 rounded-full bg-surface-bright ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
            <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQGNMUbf71AWhM5hY47cLtu9fidL7EzkEORWncvy7ia6AwVxQM8x9J4CS2y6Wy4KJnpVUiSly4uhSIIgr-4EIIjEdbdm5oT6r5gN-IidDke-961sIGbaf2sz8Iwa3-TBlw9P2yMsbXIXe3Sry0q5LWkNC0JP_VUHpQYW71QUJ2Hrv530gGYcNX-AFm8UiqXuPYJ0x49Ccyh-_5kL1hssZVNoKECxdYxsBWojbmU1n-_Q3eLPtkGMErx73FVbqW-k8H5oMmIZJ3gy4" />
            <AvatarFallback className="text-[10px]">0x</AvatarFallback>
          </Avatar>
        </div>

        <button className="p-2 text-slate-400 hover:text-foreground hover:bg-surface-container transition-all rounded-lg">
          <AccountBalanceWalletIcon className="size-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-foreground hover:bg-surface-container transition-all rounded-lg">
          <HubIcon className="size-5" />
        </button>
      </div>
    </header>
  )
}
