'use client'

import { useAppKit } from '@reown/appkit/react'
import { ArrowRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { useConnection } from 'wagmi'
import {
  AccountBalanceIcon,
  DarkModeIcon,
  DashboardIcon,
  GavelIcon,
  GroupsIcon,
  HubIcon,
  LogoutIcon,
  PaymentsIcon,
  // SettingsIcon,
  ShieldLockIcon,
  VerifiedIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { cn } from '@/utils'

const mainNav = [
  { title: 'Overview', href: '/dashboard', icon: DashboardIcon },
  { title: 'People', href: '/people', icon: GroupsIcon },
  { title: 'Payroll', href: '/payroll', icon: PaymentsIcon },
  { title: 'Negotiate', href: '/negotiate', icon: GavelIcon },
  { title: 'Compliance', href: '/compliance', icon: GavelIcon },
  { title: 'Finance', href: '/finance', icon: AccountBalanceIcon },
  // { title: 'Settings', href: '/settings', icon: SettingsIcon },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { open } = useAppKit()
  const { isConnected } = useConnection()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  return (
    <Sidebar className="bg-surface border-none shadow-[40px_0_80px_-20px_rgba(6,14,32,0.5)]">
      <SidebarHeader className="p-6 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded-lg shadow-lg">
            <ShieldLockIcon className="text-on-primary-container size-6 fill-current" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-primary font-black italic tracking-wide text-xl leading-none font-heading">Salary Cipher</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mt-1">Sovereign Vault</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={cn(
                        'h-12 px-4 transition-all duration-300 font-heading font-semibold tracking-wide',
                        isActive
                          ? 'text-primary bg-linear-to-r from-primary/10 to-transparent border-r-2 border-primary scale-100'
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

      <SidebarFooter className="p-4 mt-auto border-t border-white/5 space-y-2">
        <button className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-500 hover:text-slate-300 transition-colors font-semibold text-sm">
          <DarkModeIcon className="size-5" />
          <span>Theme</span>
        </button>

        {isConnected
          ? (
              <Button className="w-full h-11 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] transition-all" onClick={() => open()}>
                Vault Active
              </Button>
            )
          : (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger
                  render={(
                    <Button className="w-full h-11 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] transition-all">
                      Connect Wallet
                    </Button>
                  )}
                />
                <DialogContent className="max-w-md p-0 overflow-hidden bg-surface-container-low/90 backdrop-blur-2xl border-white/10 shadow-[0_40px_80px_-20px_rgba(6,14,32,0.8)] rounded-lg gap-0">
                  <div className="p-8">
                    <div className="flex flex-col items-center mb-10 text-center">
                      <div className="w-16 h-16 bg-surface-container-highest flex items-center justify-center rounded-xl mb-4 border border-white/5 shadow-inner">
                        <HubIcon className="text-primary size-10" />
                      </div>
                      <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground mb-2">Salary Cipher</h2>
                      <p className="text-muted-foreground font-medium text-sm">Sovereign Vault Access</p>
                    </div>

                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="font-heading text-xl font-semibold text-foreground">Connect your wallet to continue</h3>
                        <p className="text-muted-foreground text-xs mt-1">Choose a provider to authenticate your cryptographic identity.</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setIsModalOpen(false)
                            open({ view: 'Connect' })
                          }}
                          className="w-full group flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-all duration-200 border border-transparent hover:border-white/10 rounded-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#E2761B]/10 flex items-center justify-center rounded">
                              <div className="size-6 bg-[#E2761B] rounded-full opacity-80" />
                            </div>
                            <span className="font-semibold text-foreground">MetaMask</span>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>

                        <button
                          onClick={() => {
                            setIsModalOpen(false)
                            open({ view: 'Connect' })
                          }}
                          className="w-full group flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-all duration-200 border border-transparent hover:border-white/10 rounded-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded">
                              <div className="size-6 bg-primary rounded-full opacity-80" />
                            </div>
                            <span className="font-semibold text-foreground">WalletConnect</span>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <div className="flex items-start gap-3 p-4 bg-surface-container-lowest/50 rounded-lg">
                          <VerifiedIcon className="text-tertiary size-5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-[11px] text-foreground font-medium leading-relaxed">
                              All connections are processed via <span className="font-bold text-tertiary">Fully Homomorphic Encryption</span>.
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Your private keys are never exposed. Authentication happens on-chain within the Sovereign Vault.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-lowest/30 border-t border-white/5 flex justify-between px-6">
                    <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="size-3.5" />
                      Support Center
                    </button>
                    <div className="flex gap-4">
                      <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Privacy</button>
                      <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Terms</button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

        <button className="flex items-center gap-3 w-full px-4 py-2.5 text-destructive/80 hover:text-destructive transition-colors font-semibold text-sm mt-1">
          <LogoutIcon className="size-5" />
          <span>Disconnect</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
