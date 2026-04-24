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
        string memory name
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
}
