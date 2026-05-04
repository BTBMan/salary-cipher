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
  getUtcDaysInMonth,
  normalizeAddresses,
} from './utils'

const assetCases = [
  { label: 'USDC', asset: SettlementAssetEnum.USDC },
  { label: 'USDT', asset: SettlementAssetEnum.USDT },
] as const

const DAY_SECONDS = 24n * 60n * 60n

for (const assetCase of assetCases) {
  describe(`salaryCipherCore (${assetCase.label})`, () => {
    async function companyFixture() {
      return createSalaryCipherCompanyFixture({ asset: assetCase.asset })
    }

    it('executes payroll by directly transferring confidential funds to the employee payout wallet', async () => {
      const companyStartTime = computeNextMonthlyPayrollTimestamp(BigInt(await time.latest()), 1)
      await time.increaseTo(companyStartTime)

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

      const firstPayrollTime = computeNextMonthlyPayrollTimestamp(companyStartTime, 15)
      const payrollTime = computeFollowingMonthlyPayrollTimestamp(firstPayrollTime, 15)

      await time.increaseTo(payrollTime)

      const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      const executeReceipt = await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string
      const transferLogs = await settlementToken.getEvents.ConfidentialTransfer({
        from: companyTreasuryVault.address,
        to: employee.account.address,
      }, {
        fromBlock: executeReceipt.blockNumber,
        toBlock: executeReceipt.blockNumber,
      })
      const transferAmountHandle = transferLogs[0]?.args.amount as string | undefined

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal(500_000n)
      expect(transferAmountHandle).to.not.equal(undefined)
      expect(await decryptUint64(transferAmountHandle!, settlementToken.address, employee)).to.equal(500_000n)
      expect(await decryptUint64(transferAmountHandle!, settlementToken.address, owner)).to.equal(500_000n)
      expect(await underlyingToken.read.balanceOf([settlementToken.address])).to.equal(1_200_000n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(payrollTime)
    })

    it('prorates salary by actual previous-calendar-month days for partial-month employees', async () => {
      const companyStartTime = computeNextMonthlyPayrollTimestamp(BigInt(await time.latest()), 1)
      await time.increaseTo(companyStartTime)

      const { companyRegistry, salaryCipherCore, companyTreasuryVault, settlementToken, underlyingToken, owner, employee, publicClient, companyId }
        = await createSalaryCipherCompanyFixture({ asset: assetCase.asset })

      const employeeStartTime = companyStartTime + 15n * DAY_SECONDS

      await time.increaseTo(employeeStartTime)

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

      const firstPayrollTime = computeNextMonthlyPayrollTimestamp(companyStartTime, 15)
      const payrollTime = computeFollowingMonthlyPayrollTimestamp(firstPayrollTime, 15)

      await time.increaseTo(payrollTime)

      const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string

      const workedDays = BigInt(getUtcDaysInMonth(companyStartTime) - 15)
      const totalDays = BigInt(getUtcDaysInMonth(companyStartTime))

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal((500_000n * workedDays) / totalDays)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(payrollTime)
    })

    it('pays zero for employees who joined after the previous calendar month during early payroll', async () => {
      const companyStartTime = computeNextMonthlyPayrollTimestamp(BigInt(await time.latest()), 1)
      const employeeStartTime = companyStartTime + 3n * DAY_SECONDS

      await time.increaseTo(employeeStartTime)

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
        amount: 1_000_000n,
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

      const executeHash = await salaryCipherCore.write.executePayrollNow([companyId], {
        account: owner.account,
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal(0n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(computeNextMonthlyPayrollTimestamp(employeeStartTime, 15))
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
      const companyStartTime = computeNextMonthlyPayrollTimestamp(BigInt(await time.latest()), 1)
      await time.increaseTo(companyStartTime)

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

      const terminationTime = companyStartTime + 9n * DAY_SECONDS
      await time.increaseTo(terminationTime)

      const terminateHash = await salaryCipherCore.write.terminateEmployee(
        [companyId, employee.account.address],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: terminateHash })

      const employeeEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        employee.account.address,
      ]) as string
      const vaultEncryptedBalance = await settlementToken.read.confidentialBalanceOf([
        companyTreasuryVault.address,
      ]) as string
      const expectedTerminationPayout = (300_000n * 10n) / BigInt(getUtcDaysInMonth(companyStartTime))

      expect(await decryptUint64(employeeEncryptedBalance, settlementToken.address, employee)).to.equal(expectedTerminationPayout)
      expect(await decryptUint64(vaultEncryptedBalance, settlementToken.address, owner)).to.equal(600_000n - expectedTerminationPayout)
      expect(await companyRegistry.read.getRole([companyId, employee.account.address])).to.equal(RolesEnum.None)
      expect(await companyRegistry.read.getUserCompanies([employee.account.address])).to.deep.equal([])
      expect(await salaryCipherCore.read.startDate([companyId, employee.account.address])).to.equal(0n)
      expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.equal(0n)
    })
  })
}
