import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { RolesEnum, SettlementAssetEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture } from './fixtures'
import {
  computeFollowingMonthlyPayrollTimestamp,
  computeNextMonthlyPayrollTimestamp,
  customErrorPattern,
  decryptUint64,
  encryptUint128,
  fundVault,
  normalizeAddresses,
} from './utils'

const assetCases = [
  { label: 'USDC', asset: SettlementAssetEnum.USDC },
  { label: 'USDT', asset: SettlementAssetEnum.USDT },
] as const

for (const assetCase of assetCases) {
  describe(`salaryCipherCore (${assetCase.label})`, () => {
    async function companyFixture() {
      return createSalaryCipherCompanyFixture({ asset: assetCase.asset })
    }

    it('executes payroll by directly transferring confidential funds to the employee payout wallet', async () => {
      const { companyRegistry, salaryCipherCore, companyTreasuryVault, settlementToken, underlyingToken, owner, employee, publicClient, companyId }
        = await createSalaryCipherCompanyFixture({ asset: assetCase.asset })

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      await fundVault({
        underlyingToken,
        companyTreasuryVault,
        owner,
        publicClient,
        amount: 1_200_000n,
      })

      const [salaryHandle, salaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        500_000,
      )
      const setSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, employee.account.address, salaryHandle, salaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

      const latestBlock = await publicClient.getBlock()
      const nextPayrollTime = computeNextMonthlyPayrollTimestamp(latestBlock.timestamp, 15)
      const payrollTime = computeFollowingMonthlyPayrollTimestamp(nextPayrollTime, 15)

      await time.increaseTo(payrollTime)

      const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal(500_000n)
      expect(await underlyingToken.read.balanceOf([settlementToken.address])).to.equal(1_200_000n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(payrollTime)
    })

    it('prorates salary by actual payroll-period days for partial-month employees', async () => {
      const { companyRegistry, salaryCipherCore, companyTreasuryVault, settlementToken, underlyingToken, owner, employee, publicClient, companyId }
        = await createSalaryCipherCompanyFixture({ asset: assetCase.asset })

      const setPayrollConfigHash = await companyRegistry.write.setPayrollConfig([companyId, 31], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: setPayrollConfigHash })

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      await fundVault({
        underlyingToken,
        companyTreasuryVault,
        owner,
        publicClient,
        amount: 1_000_000n,
      })

      const latestBlock = await publicClient.getBlock()
      const nextPayrollTime = computeNextMonthlyPayrollTimestamp(latestBlock.timestamp, 31)
      const payrollTime = computeFollowingMonthlyPayrollTimestamp(nextPayrollTime, 31)
      const employeeStartTime = payrollTime - 16n * 24n * 60n * 60n

      await time.increaseTo(employeeStartTime)

      const [salaryHandle, salaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        500_000,
      )
      const setSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, employee.account.address, salaryHandle, salaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

      await time.increaseTo(payrollTime)

      const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal(258_064n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(payrollTime)
    })

    it('executes the next scheduled payroll early when requested explicitly', async () => {
      const { companyRegistry, salaryCipherCore, companyTreasuryVault, owner, employee, publicClient, companyId, underlyingToken }
        = await createSalaryCipherCompanyFixture({ asset: assetCase.asset })

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      await fundVault({
        underlyingToken,
        companyTreasuryVault,
        owner,
        publicClient,
        amount: 1_200_000n,
      })

      const [salaryHandle, salaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        500_000,
      )
      const setSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, employee.account.address, salaryHandle, salaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

      const latestBlock = await publicClient.getBlock()
      const firstPayrollTime = computeNextMonthlyPayrollTimestamp(latestBlock.timestamp, 15)
      const nextPayrollTime = computeFollowingMonthlyPayrollTimestamp(firstPayrollTime, 15)

      await time.increaseTo(firstPayrollTime)

      const firstExecuteHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: firstExecuteHash })

      await time.increaseTo(nextPayrollTime - 2n * 24n * 60n * 60n)

      await expect(
        salaryCipherCore.write.executePayroll([companyId], {
          account: owner.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('SalaryCipherCore__PayrollNotDue'))

      const executeHash = await salaryCipherCore.write.executePayrollNow([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(nextPayrollTime)

      await expect(
        salaryCipherCore.write.executePayrollNow([companyId], {
          account: owner.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('SalaryCipherCore__PayrollNotDue'))
    })

    it('limits salary proof configuration to admin and generates audit results', async () => {
      const { companyRegistry, salaryCipherCore, owner, hr, employee, outsider, publicClient, companyId }
        = await loadFixture(companyFixture)

      await expect(
        salaryCipherCore.write.setSalaryProofAddress([outsider.account.address], {
          account: outsider.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('SalaryCipherCore__OnlyAdmin'))

      const setProofHash = await salaryCipherCore.write.setSalaryProofAddress(
        [outsider.account.address],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setProofHash })

      const addHrHash = await companyRegistry.write.addEmployee(
        [companyId, hr.account.address, RolesEnum.HR, 'Helen'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addHrHash })

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      const [hrSalaryHandle, hrSalaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        200_000,
      )
      const setHrSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, hr.account.address, hrSalaryHandle, hrSalaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setHrSalaryHash })

      const [employeeSalaryHandle, employeeSalaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        700_000,
      )
      const setEmployeeSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, employee.account.address, employeeSalaryHandle, employeeSalaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setEmployeeSalaryHash })

      const generateAuditHash = await salaryCipherCore.write.generateAudit([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: generateAuditHash })

      const finalizeAuditHash = await salaryCipherCore.write.finalizeAudit([companyId, 1n], {
        account: hr.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: finalizeAuditHash })

      const auditReport = await salaryCipherCore.read.auditReports([companyId, 1n])
      expect(normalizeAddresses([await salaryCipherCore.read.salaryProofAddress()])[0]).to.equal(
        normalizeAddresses([outsider.account.address])[0],
      )
      expect(auditReport[0]).to.not.equal(0n)
      expect(auditReport[2]).to.equal(2n)
    })

    it('terminates employee after settling leftover salary and removes them from the registry', async () => {
      const { companyRegistry, salaryCipherCore, companyTreasuryVault, underlyingToken, owner, employee, publicClient, companyId }
        = await loadFixture(companyFixture)

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      await fundVault({
        underlyingToken,
        companyTreasuryVault,
        owner,
        publicClient,
        amount: 600_000n,
      })

      const [salaryHandle, salaryProof] = await encryptUint128(
        salaryCipherCore.address,
        owner.account.address,
        300_000,
      )
      const setSalaryHash = await salaryCipherCore.write.setSalary(
        [companyId, employee.account.address, salaryHandle, salaryProof],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

      const latestBlock = await publicClient.getBlock()
      const nextPayrollTime = computeNextMonthlyPayrollTimestamp(latestBlock.timestamp, 15)
      const payrollTime = computeFollowingMonthlyPayrollTimestamp(nextPayrollTime, 15)

      await time.increaseTo(payrollTime)

      const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const terminateHash = await salaryCipherCore.write.terminateEmployee(
        [companyId, employee.account.address],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: terminateHash })

      expect(await companyRegistry.read.getRole([companyId, employee.account.address])).to.equal(RolesEnum.None)
      expect(await companyRegistry.read.getUserCompanies([employee.account.address])).to.deep.equal([])
      expect(await salaryCipherCore.read.startDate([companyId, employee.account.address])).to.equal(0n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(payrollTime)
    })
  })
}
