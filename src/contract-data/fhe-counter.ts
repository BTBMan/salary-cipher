import type { Address } from 'viem'

export const FHECounter = {
  addresses: {} as Record<number, Address>,
  abi: [
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "handle",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "SenderNotAllowedToUseHandle",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "inputEuint32",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "decrement",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCount",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "inputEuint32",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "increment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "input",
          "type": "uint256"
        }
      ],
      "name": "increment2",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const
