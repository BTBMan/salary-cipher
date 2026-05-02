'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdAddCircle as AddCircleIcon } from 'react-icons/md'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStoreContext } from '@/hooks'
import { CompanyList } from '../onboarding/company-list'

interface CompanySelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Workspace switcher dialog rendered from the top header.
 */
export function CompanySelectorDialog({ open, onOpenChange }: CompanySelectorDialogProps) {
  const router = useRouter()
  const { companies, selectCompany } = useStoreContext()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-4 bg-surface-container p-0">
        <DialogHeader className="border-b border-white/5 px-6 py-5">
          <DialogTitle>Switch Company</DialogTitle>
          <DialogDescription>
            Select another company workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <CompanyList
            companies={companies}
            onSelect={(companyId) => {
              selectCompany(companyId)
              onOpenChange(false)
              router.push('/overview')
            }}
          />
        </div>

        <div className="border-t border-white/5 px-6 py-5">
          <Link
            href="/onboarding/create-company"
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
          >
            <AddCircleIcon className="size-4" />
            Create New Company
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
