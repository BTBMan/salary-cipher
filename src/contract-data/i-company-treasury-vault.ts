import type { Address } from 'viem'

export const ICompanyTreasuryVault = {
  addresses: {} as Record<number, Address>,
  abi: [
    {
      "inputs": [],
      "name": "CompanyTreasuryVault__InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyTreasuryVault__InvalidAmount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyTreasuryVault__InvalidUnwrapRequest",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyTreasuryVault__PendingRefundExists",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyTreasuryVault__TransferFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyTreasuryVault__Unauthorized",
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
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "executedAt",
          "type": "uint256"
        }
      ],
      "name": "PayrollTransferred",
      "type": "event"
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
          "name": "from",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "UnderlyingDepositedAndWrapped",
      "type": "event"
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
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "unwrapRequestId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "amount",
          "type": "uint64"
        }
      ],
      "name": "UnderlyingUnwrapFinalized",
      "type": "event"
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
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "unwrapRequestId",
          "type": "bytes32"
        }
      ],
      "name": "UnderlyingUnwrapRequested",
      "type": "event"
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
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "UnusedUnderlyingWithdrawn",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "depositAndWrapUnderlying",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "unwrapRequestId",
          "type": "bytes32"
        },
        {
          "internalType": "uint64",
          "name": "amount",
          "type": "uint64"
        },
        {
          "internalType": "bytes",
          "name": "decryptionProof",
          "type": "bytes"
        }
      ],
      "name": "finalizeRefundUnwrap",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getConfidentialBalance",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "grantManagerBalanceAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "euint64",
          "name": "amount",
          "type": "bytes32"
        }
      ],
      "name": "payrollTransfer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "refreshManagerBalanceAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "refundAllWrappedUnderlying",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "withdrawUnusedUnderlying",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const
