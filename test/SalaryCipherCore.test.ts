import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { ignition, viem } from 'hardhat'
import SalaryCipherCoreModule from '../ignition/modules/SalaryCipherCore'
import { RolesEnum } from '../src/enums'
import { customErrorPattern, decryptBool, decryptUint128, encryptUint128 } from './utils'

describe('salaryCipherCore', () => {
  async function deploySalaryCipherCoreFixture() {
    const [owner, hr, employee, outsider] = await viem.getWalletClients()
    const publicClient = await viem.getPublicClient()
    const { companyRegistry, salaryCipherCore } = await ignition.deploy(SalaryCipherCoreModule)

    return {
      companyRegistry,
      salaryCipherCore,
      owner,
      hr,
      employee,
      outsider,
      publicClient,
    }
  }

  async function createCompanyFixture() {
    const fixture = await deploySalaryCipherCoreFixture()
    const { companyRegistry, owner, publicClient } = fixture

    const hash = await companyRegistry.write.createCompany(['Acme'], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash })

    return { ...fixture, companyId: 1n }
  }

  it('handles payroll balance, salary accrual and payout claim', async () => {
    const { companyRegistry, salaryCipherCore, owner, employee, publicClient, companyId }
      = await loadFixture(createCompanyFixture)

    const addEmployeeHash = await companyRegistry.write.addEmployee(
      [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

    const setWalletHash = await salaryCipherCore.write.setReceivingWallet(
      [companyId, employee.account.address],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: setWalletHash })

    const [salaryHandle, salaryProof] = await encryptUint128(
      salaryCipherCore.address,
      owner.account.address,
      5000,
    )
    const setSalaryHash = await salaryCipherCore.write.setSalary(
      [companyId, employee.account.address, salaryHandle, salaryProof],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

    const depositHash = await salaryCipherCore.write.deposit([companyId, 12000n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: depositHash })

    const executeHash = await salaryCipherCore.write.executePayroll([companyId], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: executeHash })

    const encryptedBalance = await salaryCipherCore.read.companyBalance([companyId]) as string
    const encryptedPending = await salaryCipherCore.read.pendingPayout([
      companyId,
      employee.account.address,
    ]) as string

    expect(await decryptUint128(encryptedBalance, salaryCipherCore.address, owner)).to.equal(7000n)
    expect(await decryptUint128(encryptedPending, salaryCipherCore.address, employee)).to.equal(5000n)
    expect(await salaryCipherCore.read.lastPayrollTime([companyId])).to.not.equal(0n)

    const claimHash = await salaryCipherCore.write.claimPayout([companyId], {
      account: employee.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: claimHash })

    const encryptedPendingAfterClaim = await salaryCipherCore.read.pendingPayout([
      companyId,
      employee.account.address,
    ]) as string
    expect(await decryptUint128(encryptedPendingAfterClaim, salaryCipherCore.address, employee)).to.equal(0n)
  })

  it('limits salary proof configuration to admin and generates audit results', async () => {
    const { companyRegistry, salaryCipherCore, owner, hr, employee, outsider, publicClient, companyId }
      = await loadFixture(createCompanyFixture)

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
      2000,
    )
    const setHrSalaryHash = await salaryCipherCore.write.setSalary(
      [companyId, hr.account.address, hrSalaryHandle, hrSalaryProof],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: setHrSalaryHash })

    const [employeeSalaryHandle, employeeSalaryProof] = await encryptUint128(
      salaryCipherCore.address,
      owner.account.address,
      7000,
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
    expect(auditReport[2]).to.equal(2n)
    expect(await decryptUint128(auditReport[1] as string, salaryCipherCore.address, owner)).to.equal(9000n)
    expect(await decryptBool(auditReport[3] as string, salaryCipherCore.address, hr)).to.equal(false)
  })

  it('settles termination payout and removes the employee through the registry', async () => {
    const { companyRegistry, salaryCipherCore, owner, employee, publicClient, companyId }
      = await loadFixture(createCompanyFixture)

    const addEmployeeHash = await companyRegistry.write.addEmployee(
      [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

    const authorizeCoreHash = await companyRegistry.write.setAuthorizedCaller(
      [companyId, salaryCipherCore.address, true],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: authorizeCoreHash })

    const [salaryHandle, salaryProof] = await encryptUint128(
      salaryCipherCore.address,
      owner.account.address,
      3000,
    )
    const setSalaryHash = await salaryCipherCore.write.setSalary(
      [companyId, employee.account.address, salaryHandle, salaryProof],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

    // 30 days
    await time.increase(30 * 24 * 60 * 60)

    const terminateHash = await salaryCipherCore.write.terminateEmployee(
      [companyId, employee.account.address],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: terminateHash })

    expect(await companyRegistry.read.getRole([companyId, employee.account.address])).to.equal(RolesEnum.None)
    expect(await companyRegistry.read.getUserCompanies([employee.account.address])).to.deep.equal([])
    expect(await salaryCipherCore.read.startDate([companyId, employee.account.address])).to.equal(0n)
  })
})
