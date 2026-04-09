import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const FHECounterModule = buildModule('FHECounterModule', (m) => {
  const fheCounter = m.contract('FHECounter', [], {})

  return { fheCounter }
})

export default FHECounterModule
