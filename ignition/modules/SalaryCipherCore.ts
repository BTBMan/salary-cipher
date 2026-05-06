import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import CompanyRegistryModule from './CompanyRegistry'

const SalaryCipherCoreModule = buildModule('SalaryCipherCoreModule', (m) => {
  const { companyRegistry, usdc, usdt, cUsdc, cUsdt } = m.useModule(CompanyRegistryModule)
  const salaryCipherCore = m.contract('SalaryCipherCore', [companyRegistry], {})
  const salaryNegotiation = m.contract('SalaryNegotiation', [companyRegistry, salaryCipherCore], {})
  const proofNFT = m.contract('ProofNFT', [], {})
  const salaryProof = m.contract('SalaryProof', [companyRegistry, salaryCipherCore, proofNFT], {})
  const salaryCipherFactory = m.contract('SalaryCipherFactory', [companyRegistry, salaryCipherCore], {})

  m.call(companyRegistry, 'setCompanyFactory', [salaryCipherFactory], { id: 'ConfigureCompanyFactory' })
  m.call(salaryCipherCore, 'setSalaryNegotiationAddress', [salaryNegotiation], { id: 'ConfigureSalaryNegotiation' })
  m.call(proofNFT, 'setSalaryProofContract', [salaryProof], { id: 'ConfigureSalaryProofMinter' })
  m.call(salaryCipherCore, 'setSalaryProofAddress', [salaryProof], { id: 'ConfigureSalaryProof' })

  return { companyRegistry, salaryCipherCore, salaryNegotiation, proofNFT, salaryProof, salaryCipherFactory, usdc, usdt, cUsdc, cUsdt }
})

export default SalaryCipherCoreModule
