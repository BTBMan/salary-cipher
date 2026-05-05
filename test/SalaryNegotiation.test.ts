import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { RolesEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture } from './fixtures'
import {
  customErrorPattern,
  decryptBool,
  decryptUint128,
  encryptUint128,
} from './utils'

const Status = {
  Open: 0,
  WaitingEmployerOffer: 1,
  WaitingEmployeeAsk: 2,
  ReadyToMatch: 3,
  Computed: 4,
  Applied: 5,
  Cancelled: 6,
} as const

async function negotiationCompanyFixture() {
  const fixture = await createSalaryCipherCompanyFixture()
  const { companyRegistry, salaryCipherCore, owner, employee, publicClient, companyId } = fixture

  const addEmployeeHash = await companyRegistry.write.addEmployee(
    [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
    { account: owner.account },
  )
  await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

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

  return fixture
}

describe('salaryNegotiation', () => {
  it('lets owner initiate, employee respond, compute match, and apply the encrypted offer as salary', async () => {
    const { salaryNegotiation, salaryCipherCore, owner, employee, outsider, publicClient, companyId } = await loadFixture(negotiationCompanyFixture)

    const createHash = await salaryNegotiation.write.createNegotiation(
      [companyId, employee.account.address],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: createHash })

    const [offerHandle, offerProof] = await encryptUint128(
      salaryNegotiation.address,
      owner.account.address,
      700_000,
    )
    const offerHash = await salaryNegotiation.write.submitEmployerOffer(
      [1n, offerHandle, offerProof],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: offerHash })

    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.WaitingEmployeeAsk)

    const [askHandle, askProof] = await encryptUint128(
      salaryNegotiation.address,
      employee.account.address,
      650_000,
    )
    const askHash = await salaryNegotiation.write.submitEmployeeAsk(
      [1n, askHandle, askProof],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: askHash })

    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.ReadyToMatch)

    const computeHash = await salaryNegotiation.write.computeMatch([1n], {
      account: outsider.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: computeHash })

    const computedRound = await salaryNegotiation.read.getNegotiationRound([1n, 1n])
    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.Computed)
    expect(await decryptBool(computedRound.matched as string, salaryNegotiation.address, owner)).to.equal(true)
    expect(await decryptBool(computedRound.matched as string, salaryNegotiation.address, employee)).to.equal(true)
    expect(await decryptUint128(computedRound.finalSalary as string, salaryNegotiation.address, owner)).to.equal(700_000n)

    const applyHash = await salaryNegotiation.write.applyMatchedSalary([1n], {
      account: owner.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: applyHash })

    const salaryHandle = await salaryCipherCore.read.monthlySalary([
      companyId,
      employee.account.address,
    ]) as string

    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.Applied)
    expect(await salaryNegotiation.read.activeNegotiationId([companyId, employee.account.address])).to.equal(0n)
    expect(await decryptUint128(salaryHandle, salaryCipherCore.address, employee)).to.equal(700_000n)
    expect(await decryptUint128(salaryHandle, salaryCipherCore.address, owner)).to.equal(700_000n)
  })

  it('lets employee initiate with ask first and start a new round after the computed result', async () => {
    const { salaryNegotiation, owner, employee, publicClient, companyId } = await loadFixture(negotiationCompanyFixture)

    const createHash = await salaryNegotiation.write.createNegotiation(
      [companyId, employee.account.address],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: createHash })

    const [askHandle, askProof] = await encryptUint128(
      salaryNegotiation.address,
      employee.account.address,
      900_000,
    )
    const askHash = await salaryNegotiation.write.submitEmployeeAsk(
      [1n, askHandle, askProof],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: askHash })

    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.WaitingEmployerOffer)

    const [offerHandle, offerProof] = await encryptUint128(
      salaryNegotiation.address,
      owner.account.address,
      700_000,
    )
    const offerHash = await salaryNegotiation.write.submitEmployerOffer(
      [1n, offerHandle, offerProof],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: offerHash })

    const computeHash = await salaryNegotiation.write.computeMatch([1n], {
      account: employee.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: computeHash })

    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.Computed)

    const newRoundHash = await salaryNegotiation.write.newRound([1n], {
      account: employee.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: newRoundHash })

    const negotiation = await salaryNegotiation.read.negotiations([1n])
    const secondRound = await salaryNegotiation.read.getNegotiationRound([1n, 2n])

    expect(negotiation[3]).to.equal(2n)
    expect(negotiation[4]).to.equal(Status.Open)
    expect(secondRound.hasEmployerOffer).to.equal(false)
    expect(secondRound.hasEmployeeAsk).to.equal(false)
  })

  it('enforces creation, submission, cancellation, and core application permissions', async () => {
    const { companyRegistry, salaryNegotiation, salaryCipherCore, owner, hr, employee, outsider, publicClient, companyId } = await loadFixture(negotiationCompanyFixture)

    await expect(
      salaryNegotiation.write.createNegotiation([companyId, employee.account.address], {
        account: outsider.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryNegotiation__Unauthorized'))

    await expect(
      salaryNegotiation.write.createNegotiation([companyId, owner.account.address], {
        account: owner.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryNegotiation__InvalidEmployee'))

    const addHrHash = await companyRegistry.write.addEmployee(
      [companyId, hr.account.address, RolesEnum.HR, 'Helen'],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: addHrHash })

    const createHash = await salaryNegotiation.write.createNegotiation(
      [companyId, employee.account.address],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: createHash })

    await expect(
      salaryNegotiation.write.createNegotiation([companyId, employee.account.address], {
        account: owner.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryNegotiation__ActiveNegotiationExists'))

    const [askHandle, askProof] = await encryptUint128(
      salaryNegotiation.address,
      owner.account.address,
      650_000,
    )
    await expect(
      salaryNegotiation.write.submitEmployeeAsk([1n, askHandle, askProof], {
        account: owner.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryNegotiation__Unauthorized'))

    const [offerHandle, offerProof] = await encryptUint128(
      salaryNegotiation.address,
      employee.account.address,
      700_000,
    )
    await expect(
      salaryNegotiation.write.submitEmployerOffer([1n, offerHandle, offerProof], {
        account: employee.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryNegotiation__Unauthorized'))

    await expect(
      salaryCipherCore.write.setNegotiatedSalary([companyId, employee.account.address, offerHandle], {
        account: outsider.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryCipherCore__OnlySalaryNegotiation'))

    await expect(
      salaryNegotiation.write.cancelNegotiation([1n], {
        account: outsider.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryNegotiation__Unauthorized'))

    const cancelHash = await salaryNegotiation.write.cancelNegotiation([1n], {
      account: employee.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: cancelHash })

    expect((await salaryNegotiation.read.negotiations([1n]))[4]).to.equal(Status.Cancelled)
    expect(await salaryNegotiation.read.activeNegotiationId([companyId, employee.account.address])).to.equal(0n)
  })
})
