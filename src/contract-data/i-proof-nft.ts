import type { Address } from 'viem'

export const IProofNFT = {
  addresses: {} as Record<number, Address>,
  abi: [
    {
      "inputs": [],
      "name": "ProofNFT__InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ProofNFT__InvalidTokenURI",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ProofNFT__OnlySalaryProof",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ProofNFT__ProofAlreadyMinted",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
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
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "ProofNFTMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "salaryProofContract",
          "type": "address"
        }
      ],
      "name": "SalaryProofContractUpdated",
      "type": "event"
    }
  ],
} as const
