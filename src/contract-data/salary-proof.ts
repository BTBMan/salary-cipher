import type { Address } from 'viem'

export const SalaryProof = {
  addresses: {
    31337: '0x53DaB165b879542E9aDFC41c6474A9d797B9b042',
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
        },
        {
          "internalType": "address",
          "name": "proofNFTAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
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
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        }
      ],
      "name": "authorizeVerifier",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        }
      ],
      "name": "authorizedVerifiers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "authorized",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
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
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "enum ISalaryProof.ProofType",
          "name": "proofType",
          "type": "uint8"
        },
        {
          "internalType": "externalEuint128",
          "name": "encryptedMin",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint128",
          "name": "encryptedMax",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "uint32",
          "name": "durationMonths",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "validityDays",
          "type": "uint32"
        }
      ],
      "name": "generateProof",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "employee",
          "type": "address"
        }
      ],
      "name": "getEmployeeProofIds",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "proofIds",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "mintProofNFT",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextProofId",
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
      "inputs": [],
      "name": "proofNFT",
      "outputs": [
        {
          "internalType": "contract ProofNFT",
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
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        }
      ],
      "name": "proofs",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "employee",
          "type": "address"
        },
        {
          "internalType": "enum ISalaryProof.ProofType",
          "name": "proofType",
          "type": "uint8"
        },
        {
          "internalType": "ebool",
          "name": "result",
          "type": "bytes32"
        },
        {
          "internalType": "uint64",
          "name": "createdAt",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "expiresAt",
          "type": "uint64"
        },
        {
          "internalType": "bool",
          "name": "revoked",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "minted",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        }
      ],
      "name": "revokeProof",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "salaryCipherCore",
      "outputs": [
        {
          "internalType": "contract ISalaryCipherCore",
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
          "internalType": "uint256",
          "name": "proofId",
          "type": "uint256"
        }
      ],
      "name": "verifyProof",
      "outputs": [
        {
          "internalType": "bool",
          "name": "valid",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "expired",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "revoked",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
} as const
