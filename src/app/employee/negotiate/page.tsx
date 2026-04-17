'use client'

import {
  ArrowLeft,
  Lock,
  Send,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { EncryptedField } from '@/components/encrypted-field'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
// import { Textarea } from '@/components/ui/textarea'

export default function NegotiationPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={(
              <Link href="/employee">
                <ArrowLeft className="size-4" />
              </Link>
            )}
          />
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Salary Negotiation</h1>
            <p className="text-muted-foreground">End-to-end encrypted proposal with the HR department.</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-500 border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1">
            Active Negotiation
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Chat & Proposal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-surface-low border-none shadow-none flex flex-col h-[600px]">
              <CardHeader className="border-b border-border/30 bg-surface-container/20">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-surface-high flex items-center justify-center font-bold text-xs">HR</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">HR Representative (Internal)</span>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1">
                      <ShieldCheck className="size-3" /> Encrypted Session
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col gap-4">
                  {/* Message from HR */}
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="size-8 rounded-full bg-surface-high shrink-0 flex items-center justify-center text-[10px] font-bold">HR</div>
                    <div className="p-4 rounded-2xl bg-surface-container/50 border border-border/30 text-sm leading-relaxed">
                      Hello Sarah, we've reviewed your performance metrics for the last 6 months. We'd like to hear your thoughts on the proposed adjustments for the next cycle.
                    </div>
                  </div>

                  {/* My Message */}
                  <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                    <div className="size-8 rounded-full primary-gradient shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">ME</div>
                    <div className="p-4 rounded-2xl bg-primary text-primary-foreground text-sm leading-relaxed shadow-[0_4px_15px_rgba(99,102,241,0.2)]">
                      Thank you. I've prepared a counter-proposal based on my contributions to the Zama protocol integration. My proposed base salary adjustment is attached to the vault state.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl glass border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                        <Lock className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">My Proposal</span>
                        <EncryptedField value="$210,000.00" className="text-sm font-bold" />
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold uppercase">Pending HR Review</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t border-border/30 bg-surface-container/10">
                <div className="relative w-full">
                  <Input
                    placeholder="Type an encrypted message..."
                    className="pr-12 bg-surface-container border-none h-12"
                  />
                  <Button size="icon" className="absolute right-1 top-1 size-10 primary-gradient border-none">
                    <Send className="size-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar Area: Summary */}
          <div className="space-y-6">
            <Card className="bg-surface-container border-none shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Negotiation Stats</CardTitle>
                <CardDescription>Real-time delta analysis (Encrypted).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-high/30 border border-border/30 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Current Salary</span>
                    <EncryptedField value="$185,000" className="text-xl font-bold" />
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Your Counter</span>
                    <EncryptedField value="$210,000" className="text-xl font-bold" />
                  </div>
                  <div className="p-4 rounded-xl bg-surface-high/30 border border-border/30 space-y-2 opacity-50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">HR Response</span>
                    <div className="flex items-center gap-2">
                      <Lock className="size-3" />
                      <span className="text-sm font-bold italic">Awaiting Review...</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full primary-gradient border-none font-bold h-11">
                    Update Counter
                  </Button>
                  <Button variant="outline" className="w-full border-border/50 h-11 text-destructive hover:bg-destructive/10">
                    Cancel Negotiation
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border border-emerald-500/20 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-emerald-500" />
                <span className="text-sm font-bold font-heading text-emerald-500">Auto-Settle Enabled</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                If an agreement is reached, the new salary will be automatically applied to the next on-chain payroll cycle without manual HR intervention.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
