import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import CompanyRegistryModule from './CompanyRegistry'

const SalaryCipherCoreModule = buildModule('SalaryCipherCoreModule', (m) => {
  const { companyRegistry } = m.useModule(CompanyRegistryModule)
  const salaryCipherCore = m.contract('SalaryCipherCore', [companyRegistry], {})

  return { companyRegistry, salaryCipherCore }
})

export default SalaryCipherCoreModule
