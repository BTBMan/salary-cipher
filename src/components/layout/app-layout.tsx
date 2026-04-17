'use client'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-surface text-on-surface font-sans selection:bg-primary/30">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-surface overflow-hidden relative">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 max-w-[1400px] mx-auto w-full">
            {children}
          </main>

          {/* Ambient Depth Background for the entire app */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/5 blur-[120px]" />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
