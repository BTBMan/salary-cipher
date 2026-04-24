import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const SalaryCipherCoreModule = buildModule('SalaryCipherCoreModule', (m) => {
  const companyRegistry = m.contract('CompanyRegistry', [], {})
  const salaryCipherCore = m.contract('SalaryCipherCore', [companyRegistry], {})

  return { companyRegistry, salaryCipherCore }
})

export default SalaryCipherCoreModule
