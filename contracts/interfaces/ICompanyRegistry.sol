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
    struct Company {
        // The name of the company
        string name;
        // The owner of the company
        address owner;
        // The timestamp when the company was created
        uint256 createdAt;
    }

    struct Employee {
        // The display name of the employee
        string displayName;
        // The role of the employee
        Role role;
        // The timestamp when the employee was added
        uint256 addedAt;
    }

    struct NewEmployee {
        // The wallet address of the employee
        address account;
        // The display name of the employee
        string displayName;
        // The role of the employee
        Role role;
    }

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
    event CompanyCreated(
        uint256 indexed companyId,
        address indexed owner,
        string name,
        uint256 createdAt
    );
    event EmployeeAdded(
        uint256 indexed companyId,
        address indexed account,
        Role role,
        uint256 addedAt
    );
    event EmployeeRemoved(uint256 indexed companyId, address indexed employee);
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

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    function createCompany(
        string memory name
    ) external returns (uint256 companyId);

    function addEmployee(
        uint256 companyId,
        address account,
        Role role,
        string memory displayName
    ) external;

    function batchAddEmployees(
        uint256 companyId,
        NewEmployee[] calldata newEmployees
    ) external;

    function removeEmployee(uint256 companyId, address account) external;

    function updateRole(
        uint256 companyId,
        address account,
        Role newRole
    ) external;

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
    function getRole(
        uint256 companyId,
        address account
    ) external view returns (Role);

    function getUserCompanies(
        address account
    ) external view returns (uint256[] memory);

    function getEmployees(
        uint256 companyId
    ) external view returns (address[] memory);

    function getEmployeeCount(
        uint256 companyId
    ) external view returns (uint256);
}
