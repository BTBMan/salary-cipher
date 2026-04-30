'use client'

import type { PropsWithChildren } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-surface text-on-surface font-sans selection:bg-primary/30">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-surface relative">
          <AppHeader />
          <main className="flex-1 p-8 space-y-8 max-w-350 mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
