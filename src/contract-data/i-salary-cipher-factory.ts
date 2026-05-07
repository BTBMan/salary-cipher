import type { Address } from 'viem'

export const ISalaryCipherFactory = {
  addresses: {} as Record<number, Address>,
  abi: [
    {
      "inputs": [],
      "name": "SalaryCipherFactory__InvalidAddress",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "CompanyCreatedWithVault",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint8",
          "name": "payrollDayOfMonth",
          "type": "uint8"
        },
        {
          "internalType": "enum ICompanyRegistry.SettlementAsset",
          "name": "asset",
          "type": "uint8"
        }
      ],
      "name": "createCompany",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const
