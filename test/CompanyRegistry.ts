import type { Address } from 'viem'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { ignition, viem } from 'hardhat'
import { toFunctionSelector } from 'viem'
import CompanyRegistryModule from '../ignition/modules/CompanyRegistry'
import { RolesEnum } from '../src/enums'

describe('CompanyRegistry', () => {
  function normalizeAddresses(addresses: readonly Address[]) {
    return addresses.map(address => address.toLowerCase())
  }

  function customErrorSelector(errorName: string) {
    return toFunctionSelector(`${errorName}()`)
  }

  function customErrorPattern(errorName: string) {
    return new RegExp(`${errorName}|${customErrorSelector(errorName)}`)
  }

  async function deployCompanyRegistryFixture() {
    const [owner, hr, employee, outsider, anotherEmployee] = await viem.getWalletClients()
    const publicClient = await viem.getPublicClient()
    const { companyRegistry } = await ignition.deploy(CompanyRegistryModule)

    return {
      companyRegistry,
      owner,
      hr,
      employee,
      outsider,
      anotherEmployee,
      publicClient,
    }
  }

  async function createDefaultCompany() {
    const fixture = await deployCompanyRegistryFixture()
    const { companyRegistry, owner, publicClient } = fixture

    const hash = await companyRegistry.write.createCompany(['Acme'], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash })

    return { ...fixture, companyId: 1n }
  }

  describe('deployment', () => {
    it('deploys through ignition', async () => {
      const { companyRegistry } = await loadFixture(deployCompanyRegistryFixture)

      expect(await companyRegistry.read.nextCompanyId()).to.equal(1n)
    })
  })

  describe('createCompany', () => {
    it('stores the company and owner membership', async () => {
      const { companyRegistry, owner, companyId } = await loadFixture(createDefaultCompany)

      const company = await companyRegistry.read.companies([companyId])
      const ownerEmployee = await companyRegistry.read.companyEmployees([
        companyId,
        owner.account.address,
      ])
      const employees = await companyRegistry.read.getEmployees([companyId])
      const userCompanies = await companyRegistry.read.getUserCompanies([
        owner.account.address,
      ])

      expect(company[0]).to.equal('Acme')
      expect(company[1].toLowerCase()).to.equal(owner.account.address.toLowerCase())
      expect(ownerEmployee[0]).to.equal('Owner')
      expect(ownerEmployee[1]).to.equal(RolesEnum.Owner)
      expect(normalizeAddresses(employees)).to.deep.equal(
        normalizeAddresses([owner.account.address]),
      )
      expect(userCompanies).to.deep.equal([companyId])
      expect(await companyRegistry.read.getEmployeeCount([companyId])).to.equal(1n)
    })
  })

  describe('employee management', () => {
    it('allows owner to add employees and keeps lookup lists in sync', async () => {
      const { companyRegistry, owner, employee, companyId, publicClient }
        = await loadFixture(createDefaultCompany)

      const hash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash })

      const employeeInfo = await companyRegistry.read.companyEmployees([
        companyId,
        employee.account.address,
      ])
      const employees = await companyRegistry.read.getEmployees([companyId])
      const userCompanies = await companyRegistry.read.getUserCompanies([
        employee.account.address,
      ])

      expect(employeeInfo[0]).to.equal('Alice')
      expect(employeeInfo[1]).to.equal(RolesEnum.Employee)
      expect(normalizeAddresses(employees)).to.deep.equal(
        normalizeAddresses([owner.account.address, employee.account.address]),
      )
      expect(userCompanies).to.deep.equal([companyId])
    })

    it('allows HR to batch add employees after being granted HR role', async () => {
      const { companyRegistry, owner, hr, employee, anotherEmployee, companyId, publicClient }
        = await loadFixture(createDefaultCompany)

      const addHrHash = await companyRegistry.write.addEmployee(
        [companyId, hr.account.address, RolesEnum.HR, 'Helen'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addHrHash })

      const batchHash = await companyRegistry.write.batchAddEmployees(
        [
          companyId,
          [
            {
              account: employee.account.address,
              displayName: 'Alice',
              role: RolesEnum.Employee,
            },
            {
              account: anotherEmployee.account.address,
              displayName: 'Bob',
              role: RolesEnum.Employee,
            },
          ],
        ],
        { account: hr.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: batchHash })

      expect(await companyRegistry.read.getEmployeeCount([companyId])).to.equal(4n)
      expect(await companyRegistry.read.getRole([companyId, hr.account.address])).to.equal(RolesEnum.HR)
      expect(await companyRegistry.read.getRole([companyId, employee.account.address])).to.equal(RolesEnum.Employee)
      expect(
        await companyRegistry.read.getUserCompanies([anotherEmployee.account.address]),
      ).to.deep.equal([companyId])
    })

    it('updates role and removes employees while preserving owner constraints', async () => {
      const { companyRegistry, owner, hr, employee, companyId, publicClient }
        = await loadFixture(createDefaultCompany)

      const addHrHash = await companyRegistry.write.addEmployee(
        [companyId, hr.account.address, RolesEnum.HR, 'Helen'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addHrHash })

      const addEmployeeHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: hr.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

      const updateHash = await companyRegistry.write.updateRole(
        [companyId, employee.account.address, RolesEnum.HR],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: updateHash })

      expect(await companyRegistry.read.getRole([companyId, employee.account.address])).to.equal(RolesEnum.HR)

      const removeHash = await companyRegistry.write.removeEmployee(
        [companyId, employee.account.address],
        { account: hr.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: removeHash })

      expect(await companyRegistry.read.getRole([companyId, employee.account.address])).to.equal(RolesEnum.None)
      expect(await companyRegistry.read.getEmployeeCount([companyId])).to.equal(2n)
      expect(
        normalizeAddresses(await companyRegistry.read.getEmployees([companyId])),
      ).to.deep.equal(normalizeAddresses([owner.account.address, hr.account.address]))
      expect(
        await companyRegistry.read.getUserCompanies([employee.account.address]),
      ).to.deep.equal([])
    })
  })

  describe('access control and validation', () => {
    it('rejects unauthorized actions and invalid employee input', async () => {
      const { companyRegistry, owner, outsider, employee, companyId, publicClient }
        = await loadFixture(createDefaultCompany)

      await expect(
        companyRegistry.write.addEmployee(
          [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
          { account: outsider.account },
        ),
      ).to.be.rejectedWith(customErrorPattern('CompanyRegistry__Unauthorized'))

      await expect(
        companyRegistry.write.batchAddEmployees(
          [
            companyId,
            [
              {
                account: employee.account.address,
                displayName: 'Alice',
                role: RolesEnum.None,
              },
            ],
          ],
          { account: owner.account },
        ),
      ).to.be.rejectedWith(customErrorPattern('CompanyRegistry__InvalidRole'))

      await expect(
        companyRegistry.write.addEmployee(
          [companyId, employee.account.address, RolesEnum.None, 'Alice'],
          { account: owner.account },
        ),
      ).to.be.rejectedWith(customErrorPattern('CompanyRegistry__InvalidRole'))

      const addHash = await companyRegistry.write.addEmployee(
        [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
        { account: owner.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: addHash })

      await expect(
        companyRegistry.write.updateRole([companyId, owner.account.address, RolesEnum.HR], {
          account: owner.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('CompanyRegistry__CannotModifyOwner'))

      await expect(
        companyRegistry.write.removeEmployee([companyId, owner.account.address], {
          account: owner.account,
        }),
      ).to.be.rejectedWith(customErrorPattern('CompanyRegistry__CannotModifyOwner'))
    })
  })
})
