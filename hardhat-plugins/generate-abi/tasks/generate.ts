import { task } from 'hardhat/config'

interface Args {
  include: 'abi' | 'addresses' | 'abiAndAddresses'
}

task('generate').setAction(async (args: Args, hre) => {
  // Generate ABI from ./artifacts/contracts, ./artifacts/@openzeppelin/contracts/token, ./artifacts/@openzeppelin/confidential-contracts/token recursively
  // Generate addresses from ./ignition/deployments/xxx/deployed_addresses.json
  // Generate to ./src/contract-data/xx-xx.ts
  // The content of the generated files will be like this:
  /*
    import type { Address } from 'viem'

    export const XxxXxx = {
      addresses: {
        [chainId: number]: 0x... as Address,
      },
      abi: [
        ...
      ],
    } as const
  */
  const { include = 'abiAndAddresses' } = args
})
