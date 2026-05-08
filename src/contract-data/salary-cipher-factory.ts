import type { Address } from 'viem'

export const SalaryCipherFactory = {
  addresses: {
    31337: '0x2fe19128A8257182fdD77f90eA96D27cA342897A',
    11155111: '0x8315287a9Dc1C2bEa899De42Dbd34DCdA1eD268C',
  } as Record<number, Address>,
  abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "companyRegistryAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "salaryCipherCoreAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
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
      "inputs": [],
      "name": "companyRegistry",
      "outputs": [
        {
          "internalType": "contract ICompanyRegistry",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
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
    },
    {
      "inputs": [],
      "name": "salaryCipherCore",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
} as const
