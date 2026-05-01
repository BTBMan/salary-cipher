import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import SalaryCipherCoreModule from './SalaryCipherCore'

const MainDeployModule = buildModule('MainDeployModule', (m) => {
  const moduleResults = m.useModule(SalaryCipherCoreModule)

  return moduleResults
})

export default MainDeployModule
