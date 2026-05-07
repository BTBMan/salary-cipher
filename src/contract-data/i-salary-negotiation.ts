import type { Address } from 'viem'

export const ISalaryNegotiation = {
  addresses: {} as Record<number, Address>,
  abi: [
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
    }
  ],
} as const
