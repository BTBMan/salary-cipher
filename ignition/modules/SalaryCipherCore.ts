import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import CompanyRegistryModule from './CompanyRegistry'

const SalaryCipherCoreModule = buildModule('SalaryCipherCoreModule', (m) => {
  const { companyRegistry, usdc, usdt, cUsdc, cUsdt } = m.useModule(CompanyRegistryModule)
  const salaryCipherCore = m.contract('SalaryCipherCore', [companyRegistry], {
    after: [companyRegistry],
  })
  const salaryNegotiation = m.contract('SalaryNegotiation', [companyRegistry, salaryCipherCore], {
    after: [salaryCipherCore],
  })
  const proofNFT = m.contract('ProofNFT', [], {
    after: [salaryNegotiation],
  })
  const salaryProof = m.contract('SalaryProof', [companyRegistry, salaryCipherCore, proofNFT], {
    after: [proofNFT],
  })
  const salaryCipherFactory = m.contract('SalaryCipherFactory', [companyRegistry, salaryCipherCore], {
    after: [salaryProof],
  })

  const setCompanyFactoryCall = m.call(companyRegistry, 'setCompanyFactory', [salaryCipherFactory], { id: 'ConfigureCompanyFactory', after: [salaryCipherFactory] })
  const setSalaryNegotiationCall = m.call(salaryCipherCore, 'setSalaryNegotiationAddress', [salaryNegotiation], { id: 'ConfigureSalaryNegotiation', after: [setCompanyFactoryCall] })
  const setSalaryProofCall = m.call(proofNFT, 'setSalaryProofContract', [salaryProof], { id: 'ConfigureSalaryProofMinter', after: [setSalaryNegotiationCall] })
  m.call(salaryCipherCore, 'setSalaryProofAddress', [salaryProof], { id: 'ConfigureSalaryProof', after: [setSalaryProofCall] })

  return { companyRegistry, salaryCipherCore, salaryNegotiation, proofNFT, salaryProof, salaryCipherFactory, usdc, usdt, cUsdc, cUsdt }
})

export default SalaryCipherCoreModule
