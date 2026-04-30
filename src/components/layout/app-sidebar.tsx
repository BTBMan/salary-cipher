'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MdShield,
} from 'react-icons/md'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { sidebarMainNavItems } from '@/configs'
import { cn } from '@/utils'

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="bg-surface border-none shadow-[40px_0_80px_-20px_rgba(6,14,32,0.5)]">
      <SidebarHeader className="p-6 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded-lg shadow-lg">
            <MdShield className="text-on-primary-container size-6 fill-current" />
          </div>
          <div className="flex flex-col">
            <h1 className="brand-text font-black italic tracking-wide text-xl leading-none font-heading">Salary Cipher</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-outline font-medium mt-1">Sovereign Vault</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {sidebarMainNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={cn(
                        'h-11 px-4 transition-all duration-300 font-heading font-semibold tracking-wide',
                        isActive
                          ? 'brand-text bg-linear-to-r from-(--brand)/10 to-transparent border-r-2 border-brand'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-surface-container-low',
                      )}
                      render={(
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto border-t border-white/5">
        {/* <button className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-500 hover:text-slate-300 transition-colors font-semibold text-sm rounded-sm">
          <DarkModeIcon className="size-5" />
          <span>Theme</span>
        </button> */}

        <WalletConnection />
      </SidebarFooter>
    </Sidebar>
  )
}
