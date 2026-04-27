// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/

/* Events ********/

/* Errors ********/

/* Interfaces ****/

/* Libraries *****/

interface ICompanyRegistry {
    ////////////////////////////////////
    // Type declarations              //
    ////////////////////////////////////
    /// @notice Plain company profile stored on-chain.
    struct Company {
        // The name of the company
        string name;
        // The owner of the company
        address owner;
        // The timestamp when the company was created
        uint64 createdAt;
    }

    /// @notice Persistent employee metadata stored per company.
    struct Employee {
        // The display name of the employee
        string displayName;
        // The role of the employee
        Role role;
        // Wallet that receives payroll transfers for this employee.
        address payoutWallet;
        // The timestamp when the employee was added
        uint64 addedAt;
    }

    /// @notice Input payload used for batch employee creation.
    struct NewEmployee {
        // The wallet address of the employee
        address account;
        // The display name of the employee
        string displayName;
        // The role of the employee
        Role role;
    }

    /// @notice Immutable-ish company payroll rule stored alongside company metadata.
    struct PayrollConfig {
        // Fixed payroll day in each month.
        uint8 dayOfMonth;
        // Whether the company has configured payroll scheduling.
        bool initialized;
    }

    /// @notice Role set recognized by the registry and downstream contracts.
    enum Role {
        None,
        Owner,
        HR,
        Employee
    }
    ////////////////////////////////////
    // State variables                //
    ////////////////////////////////////

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when a new company namespace is created.
    event CompanyCreated(
        uint256 indexed companyId,
        address indexed owner,
        string name,
        uint256 createdAt
    );
    /// @notice Emitted when a new member is added to a company.
    event EmployeeAdded(
        uint256 indexed companyId,
        address indexed account,
        Role role,
        uint256 addedAt
    );
    /// @notice Emitted when a member is removed from a company.
    event EmployeeRemoved(uint256 indexed companyId, address indexed employee);
    /// @notice Emitted when a member role changes.
    event RoleUpdated(
        uint256 indexed companyId,
        address indexed employee,
        Role oldRole,
        Role newRole
    );
    /// @notice Emitted when an employee payout wallet is updated.
    event PayoutWalletUpdated(
        uint256 indexed companyId,
        address indexed employee,
        address indexed payoutWallet
    );
    /// @notice Emitted when a company payroll day is initialized or updated.
    event PayrollConfigUpdated(uint256 indexed companyId, uint8 dayOfMonth);
    /// @notice Emitted when a company settlement token is configured.
    event SettlementTokenUpdated(
        uint256 indexed companyId,
        address indexed token
    );
    /// @notice Emitted when a company treasury vault is configured.
    event TreasuryVaultUpdated(
        uint256 indexed companyId,
        address indexed vault
    );

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error CompanyRegistry__CompanyNameIsEmpty();
    error CompanyRegistry__OwnerIsZeroAddress();
    error CompanyRegistry__CompanyAlreadyExists();
    error CompanyRegistry__CompanyDoesNotExist();
    error CompanyRegistry__EmployeeIsZeroAddress();
    error CompanyRegistry__EmployeeAlreadyExists();
    error CompanyRegistry__EmployeeDoesNotExist();
    error CompanyRegistry__InvalidRole();
    error CompanyRegistry__Unauthorized();
    error CompanyRegistry__CannotModifyOwner();
    error CompanyRegistry__InvalidCaller();
    error CompanyRegistry__InvalidPayrollConfig();
    error CompanyRegistry__InvalidAddress();

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /// @notice Creates a new company and assigns the caller as owner.
    function createCompany(
        string memory name,
        uint8 payrollDayOfMonth
    ) external returns (uint256 companyId);

    /// @notice Adds one employee into the company membership list.
    function addEmployee(
        uint256 companyId,
        address account,
        Role role,
        string memory displayName
    ) external;

    /// @notice Adds multiple employees using a structured input array.
    function batchAddEmployees(
        uint256 companyId,
        NewEmployee[] calldata newEmployees
    ) external;

    /// @notice Removes one employee from the company membership list.
    function removeEmployee(uint256 companyId, address account) external;

    /// @notice Updates the role of an existing employee.
    function updateRole(
        uint256 companyId,
        address account,
        Role newRole
    ) external;

    /// @notice Grants or revokes a system contract that can act on behalf of a company.
    function setAuthorizedCaller(
        uint256 companyId,
        address caller,
        bool authorized
    ) external;

    /// @notice Sets the fixed monthly payroll day for one company.
    function setPayrollConfig(uint256 companyId, uint8 dayOfMonth) external;

    /// @notice Updates the payout wallet used for the caller's payroll receipts.
    function setPayoutWallet(uint256 companyId, address payoutWallet) external;

    /// @notice Sets the confidential settlement token used by one company.
    function setSettlementToken(uint256 companyId, address token) external;

    /// @notice Sets the treasury vault responsible for holding one company's funds.
    function setTreasuryVault(uint256 companyId, address vault) external;

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
    /// @notice Returns the effective role of an account in a company.
    function getRole(
        uint256 companyId,
        address account
    ) external view returns (Role);

    /// @notice Returns all company ids associated with a user.
    function getUserCompanies(
        address account
    ) external view returns (uint256[] memory);

    /// @notice Returns all member addresses for a company.
    function getEmployees(
        uint256 companyId
    ) external view returns (address[] memory);

    /// @notice Returns the number of members currently tracked for a company.
    function getEmployeeCount(
        uint256 companyId
    ) external view returns (uint256);

    /// @notice Returns the company info for a company id.
    function getCompany(
        uint256 companyId
    ) external view returns (Company memory companyInfo);

    /// @notice Returns the payroll config for a company.
    function getPayrollConfig(
        uint256 companyId
    ) external view returns (PayrollConfig memory payrollConfig);

    /// @notice Returns the full employee record for one account.
    function getEmployee(
        uint256 companyId,
        address account
    ) external view returns (Employee memory employeeInfo);

    /// @notice Returns the payout wallet used by one employee.
    function getPayoutWallet(
        uint256 companyId,
        address account
    ) external view returns (address payoutWallet);

    /// @notice Returns the configured confidential settlement token for a company.
    function getSettlementToken(
        uint256 companyId
    ) external view returns (address token);

    /// @notice Returns the configured treasury vault for a company.
    function getTreasuryVault(
        uint256 companyId
    ) external view returns (address vault);
}
