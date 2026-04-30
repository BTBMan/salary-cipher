import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MdAddCircle as AddCircleIcon,
  MdHelpOutline as HelpIcon,
  MdLogout as LogoutIcon,
  MdVerifiedUser as VerifiedUserIcon,
} from 'react-icons/md'
import { Logo } from '@/components/logo'
import { CompanySelector } from '@/components/onboarding/company-selector'

export const metadata: Metadata = {
  title: 'Salary Cipher | Company Selection',
  description: 'Select a sovereign vault to continue.',
}

export default function OnboardingPage() {
  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary/30 min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="fixed top-6 left-8 flex items-center gap-2 pointer-events-none opacity-40">
        <span className="font-heading font-black italic text-primary">Salary Cipher</span>
        <span className="text-[10px] font-mono text-outline uppercase tracking-widest">Sovereign Vault</span>
      </div>

      <main className="w-full max-w-2xl z-10">
        <div className="bg-surface-container shadow-[0_40px_80px_-20px_rgba(6,14,32,0.8)] rounded-lg overflow-hidden border-none">
          <div className="p-8 pb-4 text-center">
            <div className="flex justify-center mb-6">
              <Logo className="w-16 h-16" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-on-surface mb-2">Welcome to Salary Cipher</h1>
            <p className="text-on-surface-variant text-sm max-w-sm mx-auto">Select a sovereign vault to continue managing your cryptographic payroll and compliance.</p>
          </div>

          <CompanySelector />

          <div className="p-8 pt-4">
            <div className="w-full h-px bg-white/5 mb-6" />
            <div className="flex flex-col items-center gap-4">
              <Link href="/onboarding/create-company" className="group flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors duration-200 text-sm">
                <AddCircleIcon className="size-5 group-hover:scale-110 transition-transform" />
                Create New Company
              </Link>
              <div className="flex items-center gap-6 mt-2">
                <button className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors font-bold uppercase tracking-widest">
                  <HelpIcon className="size-3.5" />
                  Support
                </button>
                <button className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors font-bold uppercase tracking-widest">
                  <LogoutIcon className="size-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-3 opacity-60">
          <VerifiedUserIcon className="text-tertiary size-5" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">Secured by Zama Fully Homomorphic Encryption</span>
        </div>
      </main>
    </div>
  )
}
