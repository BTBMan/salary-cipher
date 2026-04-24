import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const CompanyRegistryModule = buildModule('CompanyRegistryModule', (m) => {
  const companyRegistry = m.contract('CompanyRegistry', [], {})

  return { companyRegistry }
})

export default CompanyRegistryModule
