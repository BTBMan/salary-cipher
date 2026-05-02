'use client'

import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/hooks'
import { CompanyList } from './company-list'

export function CompanySelector() {
  const router = useRouter()
  const { companies, selectCompany } = useStoreContext()

  return (
    <div className="space-y-3 px-8 py-4">
      <CompanyList
        companies={companies}
        onSelect={(companyId) => {
          selectCompany(companyId)
          router.push('/overview')
        }}
      />
    </div>
  )
}
