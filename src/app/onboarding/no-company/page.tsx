import {
  AddBusinessIcon,
  ArrowForwardIcon,
  HelpIcon,
  LockOpenIcon,
  MailIcon,
  SecurityIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Salary Cipher | Welcome to Sovereign Payroll',
  description: 'Initialize your sovereign vault or join an existing company.',
}

export default function NoCompanyPage() {
  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      {/* Ambient Background Texture */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/10 blur-[120px]" />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.5) 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* Top Logo Bar */}
      <header className="fixed top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="text-primary font-heading font-extrabold text-2xl tracking-tight">Salary Cipher</span>
          <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#ddb7ff]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-surface-container-low rounded-full flex items-center gap-2 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest font-bold">Vault Locked</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[480px] px-6 relative z-10">
        <div className="bg-surface-container-low/60 backdrop-blur-xl border border-white/10 p-8 shadow-[0_40px_80px_rgba(6,14,32,0.5)] flex flex-col gap-8 rounded-xl">
          {/* Icon/Visual Header */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-surface-container rounded-lg flex items-center justify-center shadow-inner relative overflow-hidden border border-white/5">
              <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-transparent" />
              <LockOpenIcon className="text-primary size-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-bold text-on-surface tracking-tight">No Company Found</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-[300px] mx-auto">
                Start your sovereign payroll or wait for an invitation to join an existing company.
              </p>
            </div>
          </div>

          {/* Tab Navigation Mock */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-lowest rounded-lg border border-white/5">
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 bg-surface-container text-primary shadow-sm ring-1 ring-white/5">
              <AddBusinessIcon className="size-5" />
              Create a Company
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50">
              <MailIcon className="size-5" />
              I've been invited
            </button>
          </div>

          {/* Form/Action Section */}
          <div className="space-y-6">
            <div className="p-4 bg-tertiary-container/10 rounded-lg flex gap-4 items-start border border-tertiary/10">
              <SecurityIcon className="text-tertiary size-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-tertiary uppercase tracking-tighter">Cryptographic Security</p>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  Creating a company generates a unique vault on the Zama network. This process requires a one-time gas fee.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full primary-gradient text-on-primary-fixed h-14 rounded-lg font-heading font-extrabold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group border-none">
                INITIALIZE SOVEREIGN VAULT
                <ArrowForwardIcon className="size-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" className="w-full h-12 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                <HelpIcon className="size-4" />
                Need Assistance?
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Identity */}
        <footer className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 opacity-30">
            <span className="font-heading font-black tracking-tighter text-xl text-white">ZAMA</span>
            <div className="w-1 h-1 rounded-full bg-outline" />
            <span className="font-heading font-black tracking-tighter text-xl text-white italic">FHE</span>
          </div>
          <p className="text-[10px] font-mono text-outline-variant uppercase tracking-[0.2em] font-bold">Sovereign Vault Protocol v1.0.4-Stable</p>
        </footer>
      </main>

      {/* Decorators */}
      <div className="fixed bottom-12 left-12 flex-col gap-2 pointer-events-none opacity-20 hidden lg:flex">
        <div className="text-[10px] font-mono text-primary-fixed uppercase tracking-widest">Sys_Status: IDLE</div>
        <div className="text-[10px] font-mono text-primary-fixed uppercase tracking-widest">Loc: Cloud_Region_01</div>
      </div>
    </div>
  )
}
