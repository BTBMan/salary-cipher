import { time } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { RolesEnum } from '../src/enums'
import { createSalaryCipherCompanyFixture } from './fixtures'
import {
  customErrorPattern,
  decryptBool,
  encryptUint128,
  encryptUint128Pair,
} from './utils'

const ProofType = {
  MONTHLY_GTE: 0,
  MONTHLY_BETWEEN: 1,
  EMPLOYMENT_DURATION_GTE: 2,
} as const

async function salaryProofCompanyFixture() {
  const fixture = await createSalaryCipherCompanyFixture()
  const { companyRegistry, salaryCipherCore, owner, employee, publicClient, companyId } = fixture

  const addEmployeeHash = await companyRegistry.write.addEmployee(
    [companyId, employee.account.address, RolesEnum.Employee, 'Alice'],
    { account: owner.account },
  )
  await publicClient.waitForTransactionReceipt({ hash: addEmployeeHash })

  const [salaryHandle, salaryProofInput] = await encryptUint128(
    salaryCipherCore.address,
    owner.account.address,
    500_000,
  )
  const setSalaryHash = await salaryCipherCore.write.setSalary(
    [companyId, employee.account.address, salaryHandle, salaryProofInput],
    { account: owner.account },
  )
  await publicClient.waitForTransactionReceipt({ hash: setSalaryHash })

  return fixture
}

describe('salaryProof', () => {
  it('lets an employee generate a monthly salary proof, authorize a verifier, and mint one RWA NFT', async () => {
    const { salaryProof, proofNFT, employee, outsider, publicClient, companyId } = await salaryProofCompanyFixture()

    const [minHandle, maxHandle, inputProof] = await encryptUint128Pair(
      salaryProof.address,
      employee.account.address,
      400_000,
      0,
    )
    const generateHash = await salaryProof.write.generateProof(
      [companyId, ProofType.MONTHLY_GTE, minHandle, maxHandle, inputProof, 0, 30],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: generateHash })

    const proof = await salaryProof.read.proofs([1n])
    const proofStatus = await salaryProof.read.verifyProof([1n])

    expect(proof[0]).to.equal(companyId)
    expect((proof[1] as string).toLowerCase()).to.equal(employee.account.address.toLowerCase())
    expect(proof[2]).to.equal(ProofType.MONTHLY_GTE)
    expect(await decryptBool(proof[3] as string, salaryProof.address, employee)).to.equal(true)
    expect(proofStatus[0]).to.equal(true)
    expect(proofStatus[1]).to.equal(false)
    expect(proofStatus[2]).to.equal(false)
    expect(await salaryProof.read.getEmployeeProofIds([companyId, employee.account.address])).to.deep.equal([1n])

    const authorizeHash = await salaryProof.write.authorizeVerifier(
      [1n, outsider.account.address],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: authorizeHash })

    expect(await salaryProof.read.authorizedVerifiers([1n, outsider.account.address])).to.equal(true)
    expect(await decryptBool(proof[3] as string, salaryProof.address, outsider)).to.equal(true)

    const mintHash = await salaryProof.write.mintProofNFT(
      [1n, 'ipfs://salary-proof-metadata'],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: mintHash })

    const mintedProof = await salaryProof.read.proofs([1n])
    expect(mintedProof[7]).to.equal(true)
    expect(mintedProof[8]).to.equal(1n)
    expect((await proofNFT.read.ownerOf([1n])).toLowerCase()).to.equal(employee.account.address.toLowerCase())
    expect(await proofNFT.read.tokenURI([1n])).to.equal('ipfs://salary-proof-metadata')
    expect(await proofNFT.read.proofTokenIds([1n])).to.equal(1n)
    expect(await proofNFT.read.tokenProofIds([1n])).to.equal(1n)

    await expect(
      salaryProof.write.mintProofNFT([1n, 'ipfs://another-metadata'], {
        account: employee.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryProof__ProofAlreadyMinted'))
  })

  it('supports encrypted salary range proofs and employment duration proofs', async () => {
    const { salaryProof, employee, publicClient, companyId } = await salaryProofCompanyFixture()

    const [minHandle, maxHandle, inputProof] = await encryptUint128Pair(
      salaryProof.address,
      employee.account.address,
      450_000,
      550_000,
    )
    const rangeHash = await salaryProof.write.generateProof(
      [companyId, ProofType.MONTHLY_BETWEEN, minHandle, maxHandle, inputProof, 0, 30],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: rangeHash })

    const rangeProof = await salaryProof.read.proofs([1n])
    expect(await decryptBool(rangeProof[3] as string, salaryProof.address, employee)).to.equal(true)

    const nextEligibleTimestamp = BigInt(await time.latest()) + 70n * 24n * 60n * 60n
    await time.increaseTo(nextEligibleTimestamp)

    const [dummyMinHandle, dummyMaxHandle, dummyInputProof] = await encryptUint128Pair(
      salaryProof.address,
      employee.account.address,
      0,
      0,
    )
    const durationHash = await salaryProof.write.generateProof(
      [companyId, ProofType.EMPLOYMENT_DURATION_GTE, dummyMinHandle, dummyMaxHandle, dummyInputProof, 1, 30],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: durationHash })

    const durationProof = await salaryProof.read.proofs([2n])
    expect(durationProof[2]).to.equal(ProofType.EMPLOYMENT_DURATION_GTE)
    expect(await decryptBool(durationProof[3] as string, salaryProof.address, employee)).to.equal(true)
  })

  it('enforces proof ownership, role permissions, expiration, revocation, and NFT minter permissions', async () => {
    const { companyRegistry, salaryProof, proofNFT, owner, hr, employee, outsider, publicClient, companyId } = await salaryProofCompanyFixture()

    const [minHandle, maxHandle, inputProof] = await encryptUint128Pair(
      salaryProof.address,
      employee.account.address,
      400_000,
      0,
    )

    await expect(
      salaryProof.write.generateProof(
        [companyId, ProofType.MONTHLY_GTE, minHandle, maxHandle, inputProof, 0, 30],
        { account: owner.account },
      ),
    ).to.be.rejectedWith(customErrorPattern('SalaryProof__Unauthorized'))

    await expect(
      salaryProof.write.generateProof(
        [companyId, ProofType.MONTHLY_GTE, minHandle, maxHandle, inputProof, 0, 30],
        { account: outsider.account },
      ),
    ).to.be.rejectedWith(customErrorPattern('SalaryProof__Unauthorized'))

    const addHrHash = await companyRegistry.write.addEmployee(
      [companyId, hr.account.address, RolesEnum.HR, 'Helen'],
      { account: owner.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: addHrHash })

    const generateHash = await salaryProof.write.generateProof(
      [companyId, ProofType.MONTHLY_GTE, minHandle, maxHandle, inputProof, 0, 1],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: generateHash })

    await expect(
      salaryProof.write.authorizeVerifier([1n, outsider.account.address], {
        account: hr.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryProof__Unauthorized'))

    await expect(
      proofNFT.write.mint([employee.account.address, 1n, 'ipfs://metadata'], {
        account: outsider.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('ProofNFT__OnlySalaryProof'))

    const revokeHash = await salaryProof.write.revokeProof([1n], {
      account: employee.account,
    })
    await publicClient.waitForTransactionReceipt({ hash: revokeHash })

    const revokedStatus = await salaryProof.read.verifyProof([1n])
    expect(revokedStatus[0]).to.equal(false)
    expect(revokedStatus[2]).to.equal(true)

    await expect(
      salaryProof.write.authorizeVerifier([1n, outsider.account.address], {
        account: employee.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryProof__ProofRevoked'))

    const generateExpiringHash = await salaryProof.write.generateProof(
      [companyId, ProofType.MONTHLY_GTE, minHandle, maxHandle, inputProof, 0, 1],
      { account: employee.account },
    )
    await publicClient.waitForTransactionReceipt({ hash: generateExpiringHash })

    await time.increaseTo(BigInt(await time.latest()) + 2n * 24n * 60n * 60n)

    const expiredStatus = await salaryProof.read.verifyProof([2n])
    expect(expiredStatus[0]).to.equal(false)
    expect(expiredStatus[1]).to.equal(true)

    await expect(
      salaryProof.write.mintProofNFT([2n, 'ipfs://expired-metadata'], {
        account: employee.account,
      }),
    ).to.be.rejectedWith(customErrorPattern('SalaryProof__ProofExpired'))
  })
})
