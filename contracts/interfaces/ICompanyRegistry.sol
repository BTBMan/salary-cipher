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

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
}
