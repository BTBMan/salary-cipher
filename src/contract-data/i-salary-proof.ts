import type { Address } from 'viem'

export const ISalaryProof = {
  addresses: {} as Record<number, Address>,
  abi: [
    {
      "inputs": [],
      "name": "SalaryProof__InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__InvalidDuration",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__InvalidProofType",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__InvalidTokenURI",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__InvalidValidity",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__ProofAlreadyMinted",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__ProofDoesNotExist",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__ProofExpired",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__ProofRevoked",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryProof__Unauthorized",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "employee",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum ISalaryProof.ProofType",
          "name": "proofType",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "expiresAt",
          "type": "uint64"
        }
      ],
      "name": "ProofGenerated",
      "type": "event"
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
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        }
      ],
      "name": "ProofRevoked",
      "type": "event"
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
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        }
      ],
      "name": "VerifierAuthorized",
      "type": "event"
    }
  ],
} as const
