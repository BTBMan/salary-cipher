import type { Address } from 'viem'

export const SalaryNegotiation = {
  addresses: {
    31337: '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf',
    11155111: '0x94EDC3564CAaA37884E180edC2fA61fC2e2435bB',
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
      "name": "SalaryNegotiation__ActiveNegotiationExists",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__AskAlreadySubmitted",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__InvalidEmployee",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__InvalidStatus",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__NegotiationDoesNotExist",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__OfferAlreadySubmitted",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryNegotiation__Unauthorized",
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
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "name": "EmployeeAskSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "name": "EmployerOfferSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "name": "MatchComputed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "negotiationId",
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
        }
      ],
      "name": "NegotiatedSalaryApplied",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        }
      ],
      "name": "NegotiationCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "negotiationId",
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
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        }
      ],
      "name": "NegotiationCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "name": "NewRoundStarted",
      "type": "event"
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
      "name": "activeNegotiationId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
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
          "name": "negotiationId",
          "type": "uint256"
        }
      ],
      "name": "applyMatchedSalary",
      "outputs": [
        {
          "internalType": "euint128",
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
          "name": "negotiationId",
          "type": "uint256"
        }
      ],
      "name": "cancelNegotiation",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        }
      ],
      "name": "computeMatch",
      "outputs": [
        {
          "internalType": "ebool",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
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
          "internalType": "address",
          "name": "employee",
          "type": "address"
        }
      ],
      "name": "createNegotiation",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "negotiationId",
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
      "name": "getNegotiationHistory",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
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
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "roundId",
          "type": "uint256"
        }
      ],
      "name": "getNegotiationRound",
      "outputs": [
        {
          "components": [
            {
              "internalType": "euint128",
              "name": "employerOffer",
              "type": "bytes32"
            },
            {
              "internalType": "euint128",
              "name": "employeeAsk",
              "type": "bytes32"
            },
            {
              "internalType": "euint128",
              "name": "finalSalary",
              "type": "bytes32"
            },
            {
              "internalType": "ebool",
              "name": "matched",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "hasEmployerOffer",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "hasEmployeeAsk",
              "type": "bool"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "uint64",
              "name": "resolvedAt",
              "type": "uint64"
            }
          ],
          "internalType": "struct ISalaryNegotiation.NegotiationRound",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        }
      ],
      "name": "negotiations",
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
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "currentRound",
          "type": "uint256"
        },
        {
          "internalType": "enum ISalaryNegotiation.Status",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint64",
          "name": "createdAt",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "updatedAt",
          "type": "uint64"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        }
      ],
      "name": "newRound",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "roundId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextNegotiationId",
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
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint128",
          "name": "encryptedAsk",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "submitEmployeeAsk",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "negotiationId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint128",
          "name": "encryptedOffer",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "submitEmployerOffer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const
