'use client'

import { useState } from 'react'
import {
  AccountBalanceWalletIcon,
  ArrowForwardIcon,
  CloseIcon,
  DeleteIcon,
  EditIcon,
  ExpandMoreIcon,
  FingerprintIcon,
  LockIcon,
  PersonAddIcon,
  SearchIcon,
  SecurityIcon,
} from '@/components/icons'
import { AppLayout } from '@/components/layout/app-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/utils'

const employees = [
  { id: 1, name: 'Sarah Connor', wallet: '0x8F2e...A1C4', role: 'Owner', roleColor: 'bg-tertiary-fixed text-on-tertiary-fixed', status: 'Active', joinDate: '2023-01-12', avatar: 'SC' },
  { id: 2, name: 'Marcus Wright', wallet: '0x4D1a...B9E2', role: 'HR Manager', roleColor: 'bg-primary-fixed text-on-primary-fixed', status: 'Active', joinDate: '2023-05-20', avatar: 'MW' },
  { id: 3, name: 'Kyle Reese', wallet: '0x9B4c...F2D8', role: 'Employee', roleColor: 'bg-surface-variant text-on-surface-variant', status: 'Pending', joinDate: '2024-02-01', avatar: 'KR' },
  { id: 4, name: 'Grace Harper', wallet: '0x3A2f...C4B1', role: 'Employee', roleColor: 'bg-surface-variant text-on-surface-variant', status: 'Active', joinDate: '2023-11-15', avatar: 'GH' },
]

export default function PeoplePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-on-surface">Team Directory</h1>
            <p className="text-on-surface-variant text-sm font-medium mt-1">Manage your organization's members and their encrypted compensation details.</p>
          </div>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger
              render={(
                <Button className="primary-gradient text-on-primary-container px-6 py-6 rounded-sm font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 border-none">
                  <PersonAddIcon className="size-5" />
                  + Add Employee
                </Button>
              )}
            />

            <DialogContent className="max-w-xl p-0 overflow-hidden bg-surface-container border-white/10 shadow-[0_40px_80px_-15px_rgba(6,14,32,0.6)] rounded-lg gap-0">
              {/* Add Employee Form 1:1 from HTML */}
              <div className="px-8 pt-8 pb-6 bg-surface-container-low/50">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-foreground">Add New Employee</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Step 1 of 2: Identity & Compensation</p>
                  </div>
                </div>
                {/* Stepper Visual */}
                <div className="flex items-center gap-2">
                  <div className="grow h-1.5 rounded-full bg-primary-container relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                  <div className="grow h-1.5 rounded-full bg-surface-variant" />
                </div>
              </div>

              <form className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Employee Wallet Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FingerprintIcon className="size-4 text-tertiary" />
                    </div>
                    <input
                      className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border-none rounded-lg text-on-surface font-mono text-sm focus:ring-1 focus:ring-tertiary/40 transition-all placeholder:text-outline/40 outline-none"
                      placeholder="0x..."
                      defaultValue="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Internal Role</label>
                    <div className="relative">
                      <select className="w-full h-12 px-4 bg-surface-container-lowest border-none rounded-lg text-on-surface text-sm appearance-none focus:ring-1 focus:ring-primary/40 outline-none">
                        <option value="employee">Employee</option>
                        <option value="hr">HR Administrator</option>
                        <option value="contractor">Contractor</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-on-surface-variant">
                        <ExpandMoreIcon className="size-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly Salary (USDC)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockIcon className="size-4 text-tertiary fill-current" />
                      </div>
                      <input
                        className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border-none rounded-lg text-on-surface font-mono text-sm focus:ring-1 focus:ring-tertiary/40 transition-all outline-none"
                        placeholder="0.00"
                        type="number"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-[9px] font-black text-tertiary/60 uppercase tracking-tighter">FHE ENCRYPTED</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Secondary Receiving Wallet</span>
                    <span className="text-[9px] text-outline font-bold italic uppercase">Optional</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                      <AccountBalanceWalletIcon className="size-4" />
                    </div>
                    <input className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border-none rounded-lg text-on-surface font-mono text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-outline/40 outline-none" placeholder="Alternate address..." />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <Button variant="ghost" type="button" className="font-bold text-on-surface-variant hover:text-on-surface">Cancel</Button>
                  <Button className="primary-gradient text-on-primary font-heading font-black text-sm h-12 px-8 rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2 border-none">
                    <span>Continue</span>
                    <ArrowForwardIcon className="size-4" />
                  </Button>
                </div>
              </form>
              <div className="px-8 py-4 bg-surface-container-lowest/30 flex items-center justify-center gap-2 border-t border-white/5">
                <SecurityIcon className="size-3 text-tertiary fill-current" />
                <span className="text-[9px] tracking-[0.2em] text-outline uppercase font-mono font-black">Secured by Zama FHE Protocol</span>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center bg-surface-container-low px-4 py-2.5 rounded-lg border border-white/5 max-w-md">
          <SearchIcon className="text-outline size-4 mr-3" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder:text-outline/50 outline-none font-medium"
            placeholder="Search employees by name or wallet..."
          />
        </div>

        {/* Main Data Table */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-outline text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="px-6 py-5">Employee</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5">Monthly Salary</th>
                  <th className="px-6 py-5">Salary Wallet</th>
                  <th className="px-6 py-5">Join Date</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-surface-container transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 rounded-sm border border-white/10">
                          <AvatarFallback className="bg-surface-variant text-xs font-bold text-primary">{emp.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-on-surface font-bold text-sm">{emp.name}</div>
                          <div className="text-outline font-mono text-[10px] tracking-tight mt-0.5">{emp.wallet}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={cn(emp.roleColor, 'border-none text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-1')}>
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 bg-surface-container-lowest border border-tertiary/10 px-3 py-1.5 rounded-sm w-fit group-hover:border-tertiary/30 transition-colors">
                        <LockIcon className="text-tertiary size-3 fill-current" />
                        <span className="text-tertiary font-mono tracking-[0.3em] text-[10px] font-black opacity-60">••••••••</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 bg-surface-container-lowest border border-tertiary/10 px-3 py-1.5 rounded-sm w-fit group-hover:border-tertiary/30 transition-colors">
                        <LockIcon className="text-tertiary size-3 fill-current" />
                        <span className="text-tertiary font-mono tracking-[0.3em] text-[10px] font-black opacity-60">••••••••</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant text-xs font-mono font-bold">{emp.joinDate}</td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        'flex items-center gap-2 text-[10px] font-black uppercase tracking-widest',
                        emp.status === 'Active' ? 'text-emerald-400' : 'text-outline/60',
                      )}
                      >
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          emp.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-outline/40',
                        )}
                        />
                        {emp.status}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-outline hover:text-primary transition-colors"><EditIcon className="size-4" /></button>
                        <button className="p-2 text-outline hover:text-destructive transition-colors"><DeleteIcon className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-surface-container/30 px-6 py-4 flex items-center justify-between border-t border-white/5">
            <div className="text-[10px] text-outline font-black uppercase tracking-widest">Showing 4 of 24 employees</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-surface-container border-white/5 text-outline" disabled>
                <CloseIcon className="size-3 rotate-45" /> {/* chevron replacement hack for speed */}
              </Button>
              <Button size="sm" className="h-8 px-3 bg-primary/20 text-primary text-[10px] font-black border border-primary/30">1</Button>
              <Button size="sm" className="h-8 px-3 text-outline hover:bg-surface-container text-[10px] font-black">2</Button>
              <Button size="sm" className="h-8 px-3 text-outline hover:bg-surface-container text-[10px] font-black">3</Button>
            </div>
          </div>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-heading font-black text-on-surface uppercase tracking-[0.2em]">Encryption Status</h3>
              <LockIcon className="text-tertiary size-4 fill-current" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-on-surface-variant">FHE Vault Integrity</span>
                <span className="text-emerald-400 font-mono">100% SECURE</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden shadow-inner">
                <div className="h-full w-full bg-linear-to-r from-primary to-tertiary rounded-full" />
              </div>
              <p className="text-[9px] text-outline leading-relaxed italic font-medium uppercase tracking-wider">
                All salary data is processed using FHE. Salary Cipher never sees raw salary values.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-xl border border-white/5 flex items-center relative overflow-hidden min-h-[160px] group">
            {/* Geometric pattern from design */}
            <div className="absolute right-0 top-0 w-64 h-full opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
              <svg className="w-full h-full text-primary fill-current" viewBox="0 0 100 100">
                <path d="M50 0L100 25V75L50 100L0 75V25L50 0Z" />
              </svg>
            </div>

            <div className="relative z-10 w-full space-y-4">
              <h3 className="text-xs font-heading font-black text-on-surface uppercase tracking-[0.2em]">Payroll Summary</h3>
              <div className="flex gap-16">
                <div>
                  <div className="text-[10px] text-outline uppercase font-black tracking-widest mb-1.5">Total Headcount</div>
                  <div className="text-3xl font-heading font-black text-on-surface tracking-tighter">24</div>
                </div>
                <div>
                  <div className="text-[10px] text-outline uppercase font-black tracking-widest mb-1.5">Encrypted Payload</div>
                  <div className="text-3xl font-heading font-black text-on-surface tracking-tighter">142.5 <span className="text-xs text-outline uppercase">ETH</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-outline uppercase font-black tracking-widest mb-1.5">Next Settlement</div>
                  <div className="text-3xl font-heading font-black text-primary tracking-tighter">3 DAYS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
