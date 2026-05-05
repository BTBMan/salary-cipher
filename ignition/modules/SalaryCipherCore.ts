import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import CompanyRegistryModule from './CompanyRegistry'

const SalaryCipherCoreModule = buildModule('SalaryCipherCoreModule', (m) => {
  const { companyRegistry, usdc, usdt, cUsdc, cUsdt } = m.useModule(CompanyRegistryModule)
  const salaryCipherCore = m.contract('SalaryCipherCore', [companyRegistry], {})
  const salaryNegotiation = m.contract('SalaryNegotiation', [companyRegistry, salaryCipherCore], {})
  const salaryCipherFactory = m.contract('SalaryCipherFactory', [companyRegistry, salaryCipherCore], {})

  m.call(companyRegistry, 'setCompanyFactory', [salaryCipherFactory], { id: 'ConfigureCompanyFactory' })
  m.call(salaryCipherCore, 'setSalaryNegotiationAddress', [salaryNegotiation], { id: 'ConfigureSalaryNegotiation' })

  return { companyRegistry, salaryCipherCore, salaryNegotiation, salaryCipherFactory, usdc, usdt, cUsdc, cUsdt }
})

export default SalaryCipherCoreModule
