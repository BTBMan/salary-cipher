import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import CompanyRegistryModule from './CompanyRegistry'

const SalaryCipherCoreModule = buildModule('SalaryCipherCoreModule', (m) => {
  const { companyRegistry, usdc, usdt, cUsdc, cUsdt } = m.useModule(CompanyRegistryModule)
  const salaryCipherCore = m.contract('SalaryCipherCore', [companyRegistry], {})
  const salaryCipherFactory = m.contract('SalaryCipherFactory', [companyRegistry, salaryCipherCore], {})

  m.call(companyRegistry, 'setCompanyFactory', [salaryCipherFactory], { id: 'ConfigureCompanyFactory' })

  return { companyRegistry, salaryCipherCore, salaryCipherFactory, usdc, usdt, cUsdc, cUsdt }
})

export default SalaryCipherCoreModule
