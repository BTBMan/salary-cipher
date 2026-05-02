'use client'

import { useMemo, useState } from 'react'
import {
  MdAutorenew as AutorenewIcon,
  MdDelete as DeleteIcon,
  MdEdit as EditIcon,
  MdLock as LockIcon,
  MdSearch as SearchIcon,
} from 'react-icons/md'
import { AddEmployeeDialog } from '@/components/dialogs/add-employee-dialog'
import { AppLayout } from '@/components/layout/app-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { canManagePeople, ROLE_LABELS, ROLE_TONES } from '@/constants'
import { RolesEnum } from '@/enums'
import { useCompanyEmployees, useStoreContext } from '@/hooks'
import { cn } from '@/utils'

const WHITESPACE_REGEX = /\s+/

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatJoinDate(timestamp: number) {
  if (!timestamp) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
}

function getAvatarFallback(displayName: string, account: string) {
  const parts = displayName.trim().split(WHITESPACE_REGEX).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return (parts[0]?.slice(0, 2) || account.slice(2, 4)).toUpperCase()
}

export default function PeoplePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<null | {
    account: `0x${string}`
    displayName: string
    role: RolesEnum.HR | RolesEnum.Employee
  }>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { selectedCompany } = useStoreContext()
  const canManageEmployees = canManagePeople(selectedCompany?.role)
  const {
    addEmployee,
    canEncryptSalary,
    deleteEmployee,
    deletingEmployee,
    employees,
    isAddingEmployee,
    isLoadingEmployees,
    isUpdatingEmployee,
    selectedSettlementAsset,
    updateEmployee,
  } = useCompanyEmployees(selectedCompany)
  const salarySymbol = selectedSettlementAsset?.symbol ?? 'USDC'
  const editDialogInitialValues = useMemo(() => {
    if (!editingEmployee) {
      return undefined
    }

    return {
      displayName: editingEmployee.displayName,
      role: editingEmployee.role,
      wallet: editingEmployee.account,
    }
  }, [editingEmployee])
  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return employees
    }

    return employees.filter((employee) => {
      return (
        employee.account.toLowerCase().includes(normalizedQuery)
        || employee.displayName.toLowerCase().includes(normalizedQuery)
        || employee.payoutWallet.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [employees, searchQuery])

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-on-surface">Team Directory</h1>
            <p className="text-on-surface-variant text-sm font-medium mt-1">Manage your organization's members and their encrypted compensation details.</p>
          </div>

          {canManageEmployees && (
            <AddEmployeeDialog
              key={editingEmployee?.account ?? 'add-employee'}
              canEncryptSalary={canEncryptSalary}
              initialValues={editDialogInitialValues}
              isSubmitting={editingEmployee ? isUpdatingEmployee : isAddingEmployee}
              mode={editingEmployee ? 'edit' : 'add'}
              open={isAddModalOpen}
              salarySymbol={salarySymbol}
              onOpenChange={(open) => {
                setIsAddModalOpen(open)

                if (!open) {
                  setEditingEmployee(null)
                }
              }}
              onSubmit={editingEmployee ? updateEmployee : addEmployee}
            />
          )}
        </div>

        <div className="flex items-center bg-surface-container-low px-4 py-2.5 rounded-lg border border-white/5 max-w-md">
          <SearchIcon className="text-outline size-4 mr-3" />
          <Input
            className="h-auto border-none bg-transparent px-0 py-0 text-sm font-medium shadow-none focus-visible:ring-0"
            placeholder="Search employees by name or wallet..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
        </div>

        <Card className="overflow-hidden rounded-xl border border-white/5 bg-surface-container-low py-0 shadow-2xl">
          <CardContent className="px-0">
            <Table className="text-left border-collapse">
              <TableHeader className="bg-surface-container [&_tr]:border-b-0">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Employee</TableHead>
                  <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Role</TableHead>
                  <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Monthly Salary</TableHead>
                  <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Salary Wallet</TableHead>
                  <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Join Date</TableHead>
                  <TableHead className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status</TableHead>
                  {canManageEmployees && (
                    <TableHead className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-outline">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-b-0">
                {isLoadingEmployees
                  ? (
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={canManageEmployees ? 7 : 6}>
                          <div className="flex items-center justify-center gap-2">
                            <AutorenewIcon className="size-4 animate-spin" />
                            Loading employees from chain
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : filteredEmployees.length === 0
                    ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-outline" colSpan={canManageEmployees ? 7 : 6}>
                            No employees found.
                          </TableCell>
                        </TableRow>
                      )
                    : filteredEmployees.map(emp => (
                        <TableRow key={emp.account} className="group border-white/5 hover:bg-surface-container">
                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10 rounded-sm border border-white/10">
                                <AvatarFallback className="bg-surface-variant text-xs font-bold text-primary">
                                  {getAvatarFallback(emp.displayName, emp.account)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-on-surface font-bold text-sm">{emp.displayName || formatAddress(emp.account)}</div>
                                <div className="text-outline font-mono text-[10px] tracking-tight mt-0.5">{formatAddress(emp.account)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <Badge className={cn(ROLE_TONES[emp.role], 'border-none text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-1')}>
                              {ROLE_LABELS[emp.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            {emp.role !== RolesEnum.Owner
                              && (
                                <div className="flex items-center gap-2 bg-surface-container-lowest border border-tertiary/10 px-3 py-1.5 rounded-sm w-fit group-hover:border-tertiary/30 transition-colors">
                                  <LockIcon className="text-tertiary size-3 fill-current" />
                                  <span className="text-tertiary font-mono tracking-[0.3em] text-[10px] font-black opacity-60">••••••••</span>
                                </div>
                              )}
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <div className="font-mono text-[10px] font-bold tracking-tight text-on-surface-variant">
                              {formatAddress(emp.payoutWallet)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5 text-on-surface-variant text-xs font-mono font-bold">{formatJoinDate(emp.addedAt)}</TableCell>
                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                              Active
                            </div>
                          </TableCell>
                          {canManageEmployees && (
                            <TableCell className="px-6 py-5 text-right">
                              {emp.role !== RolesEnum.Owner && (
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-outline hover:text-primary"
                                    disabled={isUpdatingEmployee}
                                    onClick={() => {
                                      setEditingEmployee({
                                        account: emp.account,
                                        displayName: emp.displayName,
                                        role: emp.role as RolesEnum.HR | RolesEnum.Employee,
                                      })
                                      setIsAddModalOpen(true)
                                    }}
                                  >
                                    <EditIcon className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-outline hover:text-destructive"
                                    disabled={deletingEmployee === emp.account}
                                    onClick={() => {
                                      void deleteEmployee(emp.account)
                                    }}
                                  >
                                    {deletingEmployee === emp.account
                                      ? <AutorenewIcon className="size-4 animate-spin" />
                                      : <DeleteIcon className="size-4" />}
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
              </TableBody>
            </Table>

            <div className="bg-surface-container/30 px-6 py-4 flex items-center justify-between border-t border-white/5">
              <div className="text-[10px] text-outline font-black uppercase tracking-widest">
                Showing {filteredEmployees.length} of {employees.length} employees
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <Card className="rounded-xl border border-white/5 bg-surface-container-low p-0">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-heading font-black text-on-surface uppercase tracking-[0.2em]">Encryption Status</h3>
                <LockIcon className="text-tertiary size-4 fill-current" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-on-surface-variant">FHE Salary Write</span>
                  <span className={cn('font-mono', canEncryptSalary ? 'text-emerald-400' : 'text-amber-400')}>
                    {canEncryptSalary ? 'READY' : 'NOT READY'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden shadow-inner">
                  <div className={cn(
                    'h-full rounded-full transition-all',
                    canEncryptSalary ? 'w-full bg-linear-to-r from-primary to-tertiary' : 'w-1/3 bg-amber-400',
                  )}
                  />
                </div>
                <p className="text-[9px] text-outline leading-relaxed italic font-medium uppercase tracking-wider">
                  Salaries are written as encrypted values. The people list only exposes public membership metadata.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative min-h-40 overflow-hidden rounded-xl border border-white/5 bg-surface-container-low p-0 lg:col-span-2">
            <CardContent className="flex h-full items-center p-6">
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
                    <div className="text-3xl font-heading font-black text-on-surface tracking-tighter">{employees.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-outline uppercase font-black tracking-widest mb-1.5">Settlement Asset</div>
                    <div className="text-3xl font-heading font-black text-on-surface tracking-tighter">{salarySymbol}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-outline uppercase font-black tracking-widest mb-1.5">Payroll Day</div>
                    <div className="text-3xl font-heading font-black text-primary tracking-tighter">
                      {selectedCompany?.payrollDayOfMonth ? `${selectedCompany.payrollDayOfMonth}th OF MONTH` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
