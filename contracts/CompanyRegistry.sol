// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/

/* Events ********/

/* Errors ********/

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";

/* Libraries *****/

/**
 * @title CompanyRegistry
 * @author BTBMan
 * @notice This is a Company Registry contract
 * @dev This contract is used to register companies and their associated data
 */
contract CompanyRegistry is ICompanyRegistry {
    ////////////////////////////////////
    // Type declarations              //
    ////////////////////////////////////

    ////////////////////////////////////
    // State variables                //
    ////////////////////////////////////
    uint256 public nextCompanyId;

    // All companies
    mapping(uint256 companyId => Company company) public companies;
    // All employees of a company
    mapping(uint256 companyId => mapping(address account => Employee employeeInfo))
        public companyEmployees;
    // The companies an employee belongs to
    mapping(address employee => uint256[] companyIds) public userCompanies;

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////

    constructor() {
        nextCompanyId = 1;
    }

    ////////////////////////////////////
    // Receive & Fallback             //
    ////////////////////////////////////

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /**
     * @notice Create a new company
     * @param name The name of the company
     */
    function createCompany(string memory name) external {
        if (bytes(name).length == 0) {
            revert CompanyRegistry__CompanyNameIsEmpty();
        }
        if (msg.sender == address(0)) {
            revert CompanyRegistry__OwnerIsZeroAddress();
        }
        if (companies[nextCompanyId].owner != address(0)) {
            revert CompanyRegistry__CompanyAlreadyExists();
        }

        companies[nextCompanyId] = Company({
            name: name,
            owner: msg.sender,
            createdAt: _blockTimestamp()
        });
        companyEmployees[nextCompanyId][msg.sender] = Employee({
            displayName: "Owner",
            role: Role.Owner,
            addedAt: _blockTimestamp()
        });
        userCompanies[msg.sender].push(nextCompanyId);

        nextCompanyId++;

        emit CompanyCreated(
            nextCompanyId - 1,
            msg.sender,
            name,
            _blockTimestamp()
        );
    }

    /**
     * @notice Add an employee to a company
     * @param companyId The ID of the company
     * @param account The address of the employee
     * @param role The role of the employee
     */
    function addEmployee(
        uint256 companyId,
        address account,
        Role role,
        string memory displayName
    ) external {
        if (companies[companyId].owner == address(0)) {
            revert CompanyRegistry__CompanyDoesNotExist();
        }
        if (account == address(0)) {
            revert CompanyRegistry__EmployeeIsZeroAddress();
        }
        if (companyEmployees[companyId][account].role != Role.None) {
            revert CompanyRegistry__EmployeeAlreadyExists();
        }

        companyEmployees[companyId][account] = Employee({
            displayName: displayName,
            role: role,
            addedAt: _blockTimestamp()
        });
        userCompanies[account].push(companyId);

        emit EmployeeAdded(companyId, account, role, _blockTimestamp());
    }

    /**
     * @notice Remove an employee from a company
     * @param companyId The ID of the company
     * @param account The address of the employee
     */
    function removeEmployee(uint256 companyId, address account) external {
        if (companies[companyId].owner == address(0)) {
            revert CompanyRegistry__CompanyDoesNotExist();
        }
        if (account == address(0)) {
            revert CompanyRegistry__EmployeeIsZeroAddress();
        }
        if (companyEmployees[companyId][account].role == Role.None) {
            revert CompanyRegistry__EmployeeDoesNotExist();
        }

        delete companyEmployees[companyId][account];
        delete userCompanies[account];

        emit EmployeeRemoved(companyId, account);
    }

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
    function _blockTimestamp() private view returns (uint32) {
        return uint32(block.timestamp);
    }
}
