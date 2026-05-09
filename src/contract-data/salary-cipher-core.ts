import type { Address } from 'viem'

export const SalaryCipherCore = {
  addresses: {
    31337: '0x26320DE63415e5AAf2BA617D97C39444eDb6F741',
    11155111: '0x80E852dfF0124930E8870EE9B62762d022F40994',
  } as Record<number, Address>,
  abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "companyRegistryAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__AuditDoesNotExist",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__OnlyAdmin",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__OnlySalaryNegotiation",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__OnlySalaryProof",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__PayrollConfigNotSet",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__PayrollNotDue",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__SalaryAlreadySet",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__SalaryNotSet",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__TreasuryVaultNotSet",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SalaryCipherCore__Unauthorized",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auditId",
          "type": "uint256"
        }
      ],
      "name": "AuditFinalized",
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
          "internalType": "uint256",
          "name": "auditId",
          "type": "uint256"
        }
      ],
      "name": "AuditGenerated",
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
          "name": "employee",
          "type": "address"
        }
      ],
      "name": "EmployeeTerminated",
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
          "name": "manager",
          "type": "address"
        }
      ],
      "name": "ManagerSalaryAccessRefreshed",
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
          "indexed": false,
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "name": "PayrollExecuted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "salaryNegotiation",
          "type": "address"
        }
      ],
      "name": "SalaryNegotiationAddressSet",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "salaryProof",
          "type": "address"
        }
      ],
      "name": "SalaryProofAddressSet",
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
          "name": "employee",
          "type": "address"
        }
      ],
      "name": "SalarySet",
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
        },
        {
          "internalType": "enum ICompanyRegistry.Role",
          "name": "role",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "displayName",
          "type": "string"
        },
        {
          "internalType": "externalEuint128",
          "name": "encryptedSalary",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "addEmployeeWithSalary",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "admin",
      "outputs": [
        {
          "internalType": "address",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "auditId",
          "type": "uint256"
        }
      ],
      "name": "auditReports",
      "outputs": [
        {
          "internalType": "uint64",
          "name": "timestamp",
          "type": "uint64"
        },
        {
          "internalType": "euint128",
          "name": "totalSalarySum",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "headcount",
          "type": "uint256"
        },
        {
          "internalType": "ebool",
          "name": "gapWithinThreshold",
          "type": "bytes32"
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
        }
      ],
      "name": "executePayroll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        }
      ],
      "name": "executePayrollNow",
      "outputs": [],
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
          "internalType": "uint256",
          "name": "auditId",
          "type": "uint256"
        }
      ],
      "name": "finalizeAudit",
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        }
      ],
      "name": "generateAudit",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "auditId",
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
        }
      ],
      "name": "lastPayrollTime",
      "outputs": [
        {
          "internalType": "uint64",
          "name": "paidAt",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "monthlySalary",
      "outputs": [
        {
          "internalType": "euint128",
          "name": "salary",
          "type": "bytes32"
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
        }
      ],
      "name": "nextAuditId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "auditId",
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
          "name": "manager",
          "type": "address"
        }
      ],
      "name": "refreshManagerSalaryAccess",
      "outputs": [],
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
          "name": "account",
          "type": "address"
        }
      ],
      "name": "salaryActive",
      "outputs": [
        {
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "salaryNegotiationAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "salaryProofAddress",
      "outputs": [
        {
          "internalType": "address",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "employee",
          "type": "address"
        },
        {
          "internalType": "euint128",
          "name": "negotiatedSalary",
          "type": "bytes32"
        }
      ],
      "name": "setNegotiatedSalary",
      "outputs": [],
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
        },
        {
          "internalType": "externalEuint128",
          "name": "encryptedSalary",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "setSalary",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "salaryNegotiation",
          "type": "address"
        }
      ],
      "name": "setSalaryNegotiationAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "salaryProof",
          "type": "address"
        }
      ],
      "name": "setSalaryProofAddress",
      "outputs": [],
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
          "name": "account",
          "type": "address"
        }
      ],
      "name": "startDate",
      "outputs": [
        {
          "internalType": "uint64",
          "name": "date",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "employee",
          "type": "address"
        }
      ],
      "name": "terminateEmployee",
      "outputs": [],
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
        },
        {
          "internalType": "enum ISalaryCipherCore.ConditionType",
          "name": "conditionType",
          "type": "uint8"
        },
        {
          "internalType": "euint128",
          "name": "threshold",
          "type": "bytes32"
        }
      ],
      "name": "verifySalaryCondition",
      "outputs": [
        {
          "internalType": "ebool",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const
