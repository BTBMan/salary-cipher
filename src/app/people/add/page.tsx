'use client'

import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  User,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils'

export default function AddEmployeePage() {
  const [step, setStep] = useState(1)
  const router = useRouter()

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
    else {
      toast.success('Employee successfully added to the encrypted ledger!')
      router.push('/people')
    }
  }

  const handleBack = () => {
    if (step > 1)
      setStep(step - 1)
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={(
              <Link href="/people">
                <ArrowLeft className="size-4" />
              </Link>
            )}
          />
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Onboard New Talent</h1>
            <p className="text-muted-foreground">Adding a new identity to the sovereign vault.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-2">
          {[
            { id: 1, label: 'Identity', icon: User },
            { id: 2, label: 'Compensation', icon: Lock },
            { id: 3, label: 'Access', icon: Wallet },
          ].map(s => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={cn(
                'size-8 rounded-full flex items-center justify-center transition-all duration-300',
                step === s.id
                  ? 'primary-gradient text-primary-foreground shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : step > s.id ? 'bg-emerald-500 text-white' : 'bg-surface-container text-muted-foreground',
              )}
              >
                {step > s.id ? <CheckCircle2 className="size-5" /> : <s.icon className="size-4" />}
              </div>
              <span className={cn(
                'text-sm font-medium hidden md:block',
                step === s.id ? 'text-foreground' : 'text-muted-foreground',
              )}
              >
                {s.label}
              </span>
              {s.id < 3 && <div className="w-12 h-[1px] bg-border/50 mx-2 hidden md:block" />}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="bg-surface-low border-none shadow-none no-border-section overflow-hidden">
          <CardHeader className="bg-surface-container/30 border-b border-border/30">
            <CardTitle className="text-xl font-heading">
              {step === 1 && 'Identity Information'}
              {step === 2 && 'Encrypted Compensation'}
              {step === 3 && 'Vault Access & Wallet'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Basic details for the employee profile.'}
              {step === 2 && 'This data is automatically encrypted via FHEVM.'}
              {step === 3 && 'Configure the on-chain identity for this employee.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <Input placeholder="e.g. John Doe" className="bg-surface-container border-none h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <Input placeholder="john@company.com" className="bg-surface-container border-none h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Department</label>
                  <Input placeholder="Engineering" className="bg-surface-container border-none h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Position</label>
                  <Input placeholder="Software Engineer" className="bg-surface-container border-none h-12" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-4">
                  <ShieldAlert className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    All financial fields below are <span className="text-primary font-bold italic">End-to-End Encrypted</span>.
                    The values are converted to Zama-compatible ciphers before being stored.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      Annual Salary <Lock className="size-3 text-tertiary" />
                    </label>
                    <Input placeholder="$0.00" className="bg-surface-container border-none h-12 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      Signing Bonus <Lock className="size-3 text-tertiary" />
                    </label>
                    <Input placeholder="$0.00" className="bg-surface-container border-none h-12 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    Tax ID / SSN <Lock className="size-3 text-tertiary" />
                  </label>
                  <Input placeholder="***-**-****" className="bg-surface-container border-none h-12 font-mono" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Wallet Address (ENS/Hex)</label>
                  <Input placeholder="0x..." className="bg-surface-container border-none h-12 font-mono" />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Permissions</label>
                  <div className="space-y-2">
                    {[
                      { label: 'View Own Encrypted Data', desc: 'Allow employee to decrypt their own salary using their keys.' },
                      { label: 'Request Salary Negotiation', desc: 'Enable the decentralized negotiation workflow.' },
                      { label: 'Automated Payouts', desc: 'Enroll this identity in the periodic settlement smart contract.' },
                    ].map((p, i) => (
                      <div key={i} className="p-4 rounded-xl bg-surface-container/50 border border-border/30 flex items-center justify-between group hover:border-primary/30 transition-colors">
                        <div>
                          <p className="text-sm font-bold">{p.label}</p>
                          <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                        </div>
                        <div className="size-5 rounded bg-primary/20 border border-primary/50 flex items-center justify-center">
                          <CheckCircle2 className="size-3 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-8 bg-surface-container/20 border-t border-border/30 flex justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className={cn('h-11 px-6', step === 1 && 'opacity-0 pointer-events-none')}
            >
              Back
            </Button>
            <Button
              className="h-11 px-10 primary-gradient border-none"
              onClick={handleNext}
            >
              {step === 3 ? 'Complete Onboarding' : 'Next Step'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  )
}

function ShieldAlert({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}
