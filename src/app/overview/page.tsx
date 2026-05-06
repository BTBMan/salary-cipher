'use client'

import DashboardPage from '@/app/dashboard/page'
import EmployeeDashboardPage from '@/app/employee/page'
import { RolesEnum } from '@/enums'
import { useStoreContext } from '@/hooks'

export default function OverviewPage() {
  const { selectedCompany, workspaceViewMode } = useStoreContext()

  if (!selectedCompany) {
    return null
  }

  if (selectedCompany.role === RolesEnum.Employee || (selectedCompany.role === RolesEnum.HR && workspaceViewMode === 'employee')) {
    return <EmployeeDashboardPage />
  }

  return <DashboardPage />
}
