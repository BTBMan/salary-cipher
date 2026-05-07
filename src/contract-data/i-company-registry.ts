import type { Address } from 'viem'

export const ICompanyRegistry = {
  addresses: {} as Record<number, Address>,
  abi: [
    {
      "inputs": [],
      "name": "CompanyRegistry__AssetNotEnabled",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__CannotModifyOwner",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__CompanyAlreadyExists",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__CompanyDoesNotExist",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__CompanyNameIsEmpty",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__EmployeeAlreadyExists",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__EmployeeDoesNotExist",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__EmployeeIsZeroAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__InvalidCaller",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__InvalidPayrollConfig",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__InvalidRole",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__InvalidSettlementAsset",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__OnlyAdmin",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__OnlyCompanyFactory",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__OwnerIsZeroAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CompanyRegistry__Unauthorized",
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
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        }
      ],
      "name": "CompanyCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "factory",
          "type": "address"
        }
      ],
      "name": "CompanyFactoryUpdated",
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
          "name": "account",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum ICompanyRegistry.Role",
          "name": "role",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "addedAt",
          "type": "uint256"
        }
      ],
      "name": "EmployeeAdded",
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
      "name": "EmployeeRemoved",
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
        },
        {
          "indexed": false,
          "internalType": "enum ICompanyRegistry.Role",
          "name": "role",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "displayName",
          "type": "string"
        }
      ],
      "name": "EmployeeUpdated",
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
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "payoutWallet",
          "type": "address"
        }
      ],
      "name": "PayoutWalletUpdated",
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
          "internalType": "uint8",
          "name": "dayOfMonth",
          "type": "uint8"
        }
      ],
      "name": "PayrollConfigUpdated",
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
        },
        {
          "indexed": false,
          "internalType": "enum ICompanyRegistry.Role",
          "name": "oldRole",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "enum ICompanyRegistry.Role",
          "name": "newRole",
          "type": "uint8"
        }
      ],
      "name": "RoleUpdated",
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
          "internalType": "enum ICompanyRegistry.SettlementAsset",
          "name": "asset",
          "type": "uint8"
        }
      ],
      "name": "SettlementAssetSelected",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "enum ICompanyRegistry.SettlementAsset",
          "name": "asset",
          "type": "uint8"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "underlyingToken",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "settlementToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "enabled",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "decimals",
          "type": "uint8"
        }
      ],
      "name": "SupportedAssetUpdated",
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
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "TreasuryVaultUpdated",
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
          "name": "account",
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
        }
      ],
      "name": "addEmployee",
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
          "components": [
            {
              "internalType": "address",
              "name": "account",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "displayName",
              "type": "string"
            },
            {
              "internalType": "enum ICompanyRegistry.Role",
              "name": "role",
              "type": "uint8"
            }
          ],
          "internalType": "struct ICompanyRegistry.NewEmployee[]",
          "name": "newEmployees",
          "type": "tuple[]"
        }
      ],
      "name": "batchAddEmployees",
      "outputs": [],
      "stateMutability": "nonpayable",
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
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
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
      "name": "createCompanyFor",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "companyId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "enum ICompanyRegistry.SettlementAsset",
          "name": "asset",
          "type": "uint8"
        }
      ],
      "name": "getAssetConfig",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "underlyingToken",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "settlementToken",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "enabled",
              "type": "bool"
            },
            {
              "internalType": "uint8",
              "name": "decimals",
              "type": "uint8"
            }
          ],
          "internalType": "struct ICompanyRegistry.AssetConfig",
          "name": "assetConfig",
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
          "name": "companyId",
          "type": "uint256"
        }
      ],
      "name": "getCompany",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            }
          ],
          "internalType": "struct ICompanyRegistry.Company",
          "name": "companyInfo",
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
          "name": "companyId",
          "type": "uint256"
        }
      ],
      "name": "getCompanySettlementAsset",
      "outputs": [
        {
          "internalType": "enum ICompanyRegistry.SettlementAsset",
          "name": "asset",
          "type": "uint8"
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
      "name": "getEmployee",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "displayName",
              "type": "string"
            },
            {
              "internalType": "enum ICompanyRegistry.Role",
              "name": "role",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "payoutWallet",
              "type": "address"
            },
            {
              "internalType": "uint64",
              "name": "addedAt",
              "type": "uint64"
            }
          ],
          "internalType": "struct ICompanyRegistry.Employee",
          "name": "employeeInfo",
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
          "name": "companyId",
          "type": "uint256"
        }
      ],
      "name": "getEmployeeCount",
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
      "name": "getEmployees",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
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
      "name": "getPayoutWallet",
      "outputs": [
        {
          "internalType": "address",
          "name": "payoutWallet",
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
        }
      ],
      "name": "getPayrollConfig",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint8",
              "name": "dayOfMonth",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "initialized",
              "type": "bool"
            }
          ],
          "internalType": "struct ICompanyRegistry.PayrollConfig",
          "name": "payrollConfig",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "getRole",
      "outputs": [
        {
          "internalType": "enum ICompanyRegistry.Role",
          "name": "",
          "type": "uint8"
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
      "name": "getSettlementToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "token",
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
        }
      ],
      "name": "getTreasuryVault",
      "outputs": [
        {
          "internalType": "address",
          "name": "vault",
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
        }
      ],
      "name": "getUnderlyingToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "stateMutability": "view",
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
      "name": "getUserCompanies",
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
          "name": "companyId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "removeEmployee",
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
          "name": "caller",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "authorized",
          "type": "bool"
        }
      ],
      "name": "setAuthorizedCaller",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "factory",
          "type": "address"
        }
      ],
      "name": "setCompanyFactory",
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
          "name": "payoutWallet",
          "type": "address"
        }
      ],
      "name": "setPayoutWallet",
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
          "internalType": "uint8",
          "name": "dayOfMonth",
          "type": "uint8"
        }
      ],
      "name": "setPayrollConfig",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "enum ICompanyRegistry.SettlementAsset",
          "name": "asset",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "underlyingToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "settlementToken",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "enabled",
          "type": "bool"
        },
        {
          "internalType": "uint8",
          "name": "decimals",
          "type": "uint8"
        }
      ],
      "name": "setSupportedAsset",
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
          "name": "vault",
          "type": "address"
        }
      ],
      "name": "setTreasuryVault",
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
        },
        {
          "internalType": "enum ICompanyRegistry.Role",
          "name": "newRole",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "displayName",
          "type": "string"
        }
      ],
      "name": "updateEmployee",
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
        },
        {
          "internalType": "enum ICompanyRegistry.Role",
          "name": "newRole",
          "type": "uint8"
        }
      ],
      "name": "updateRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const
