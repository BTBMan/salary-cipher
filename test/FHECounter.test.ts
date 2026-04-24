import { FhevmType } from '@fhevm/hardhat-plugin'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { fhevm, ignition, viem } from 'hardhat'
import { toHex, zeroHash } from 'viem'
import FHECounterModule from '../ignition/modules/FHECounter'
import { ethersWrapper } from '../src/utils'

describe('fHECounter', () => {
  async function deployFHECounter() {
    const [owner, alice, bob] = await viem.getWalletClients()
    const publicClient = await viem.getPublicClient()

    const { fheCounter } = await ignition.deploy(FHECounterModule)

    return { fheCounter, deployer: owner, alice, bob, publicClient }
  }

  describe('deployment', () => {
    it('should deploy the contract', async () => {
      const { fheCounter } = await loadFixture(deployFHECounter)

      expect(await fheCounter.read.getCount()).to.equal(zeroHash)
    })
  })

  describe('increment', () => {
    it('increment the counter by 1', async () => {
      const { fheCounter, alice, publicClient } = await deployFHECounter()

      const encryptedCountBeforeInc = await fheCounter.read.getCount()
      expect(encryptedCountBeforeInc).to.eq(zeroHash)
      const clearCountBeforeInc = 0

      // Encrypt constant 1 as a euint32
      const clearOne = 1
      const encryptedOne = await fhevm
        .createEncryptedInput(fheCounter.address, alice.account.address)
        .add32(clearOne)
        .encrypt()

      const incrementTx = await fheCounter.write.increment(
        [toHex(encryptedOne.handles[0]), toHex(encryptedOne.inputProof)],
        { account: alice.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: incrementTx })

      const encryptedCountAfterInc = await fheCounter.read.getCount() as string
      const clearCountAfterInc = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCountAfterInc,
        fheCounter.address,
        ethersWrapper(alice).ethersSigner()!,
      )

      expect(clearCountAfterInc).to.eq(BigInt(clearCountBeforeInc + clearOne))
    })
  })

  describe('decrement', () => {
    it('decrement the counter by 1', async () => {
      const { fheCounter, alice, publicClient } = await deployFHECounter()

      // Encrypt constant 1 as a euint32
      const clearOne = 1
      const encryptedOne = await fhevm
        .createEncryptedInput(fheCounter.address, alice.account.address)
        .add32(clearOne)
        .encrypt()

      const incrementTx = await fheCounter.write.increment(
        [toHex(encryptedOne.handles[0]), toHex(encryptedOne.inputProof)],
        { account: alice.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: incrementTx })

      const decrementTx = await fheCounter.write.decrement(
        [toHex(encryptedOne.handles[0]), toHex(encryptedOne.inputProof)],
        { account: alice.account },
      )
      await publicClient.waitForTransactionReceipt({ hash: decrementTx })

      const encryptedCountAfterDec = await fheCounter.read.getCount() as string
      const clearCountAfterDec = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCountAfterDec,
        fheCounter.address,
        ethersWrapper(alice).ethersSigner()!,
      )

      expect(clearCountAfterDec).to.eq(0n)
    })
  })
})
