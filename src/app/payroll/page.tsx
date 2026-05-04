'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { PayrollEmployeeView } from '@/components/payroll/payroll-employee-view'
import { PayrollManagerView } from '@/components/payroll/payroll-manager-view'
import { canManagePayroll } from '@/constants'
import { RolesEnum } from '@/enums'
import { useOverviewChainData, useStoreContext } from '@/hooks'

export default function PayrollHistoryPage() {
  const { selectedCompany } = useStoreContext()
  const overview = useOverviewChainData(selectedCompany, { payrollHistoryLimit: null })

  return (
    <AppLayout>
      {selectedCompany?.role === RolesEnum.Employee
        ? <PayrollEmployeeView overview={overview} selectedCompany={selectedCompany} />
        : canManagePayroll(selectedCompany?.role) && selectedCompany
          ? <PayrollManagerView overview={overview} selectedCompany={selectedCompany} />
          : null}
    </AppLayout>
  )
}
