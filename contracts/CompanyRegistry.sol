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
    // Employee metadata keyed by companyId + account
    mapping(uint256 companyId => mapping(address account => Employee employeeInfo))
        public companyEmployees;
    // Enumerable employee list per company
    mapping(uint256 companyId => address[] employeeAccounts)
        private companyEmployeeAccounts;
    // 1-based index into companyEmployeeAccounts for O(1) removal
    mapping(uint256 companyId => mapping(address account => uint256 indexPlusOne))
        private companyEmployeeIndexPlusOne;
    // The companies an employee belongs to
    mapping(address employee => uint256[] companyIds) public userCompanies;
    // 1-based index into userCompanies for O(1) removal
    mapping(address employee => mapping(uint256 companyId => uint256 indexPlusOne))
        private userCompanyIndexPlusOne;

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////
    modifier onlyOwner(uint256 companyId) {
        _requireCompanyOwner(companyId, msg.sender);
        _;
    }

    modifier onlyOwnerOrHR(uint256 companyId) {
        _requireCompanyOwnerOrHR(companyId, msg.sender);
        _;
    }

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
    function createCompany(
        string memory name
    ) external returns (uint256 companyId) {
        if (bytes(name).length == 0) {
            revert CompanyRegistry__CompanyNameIsEmpty();
        }

        companyId = nextCompanyId;

        companies[companyId] = Company({
            name: name,
            owner: msg.sender,
            createdAt: _blockTimestamp()
        });
        companyEmployees[companyId][msg.sender] = Employee({
            displayName: "Owner",
            role: Role.Owner,
            addedAt: _blockTimestamp()
        });
        companyEmployeeAccounts[companyId].push(msg.sender);
        companyEmployeeIndexPlusOne[companyId][msg.sender] = 1;
        userCompanies[msg.sender].push(companyId);
        userCompanyIndexPlusOne[msg.sender][companyId] = userCompanies[
            msg.sender
        ].length;

        nextCompanyId++;

        emit CompanyCreated(companyId, msg.sender, name, _blockTimestamp());
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
    ) external onlyOwnerOrHR(companyId) {
        _addEmployee(companyId, account, role, displayName);
    }

    function batchAddEmployees(
        uint256 companyId,
        NewEmployee[] calldata newEmployees
    ) external onlyOwnerOrHR(companyId) {
        uint256 length = newEmployees.length;
        for (uint256 i = 0; i < length; i++) {
            NewEmployee calldata newEmployee = newEmployees[i];
            _addEmployee(
                companyId,
                newEmployee.account,
                newEmployee.role,
                newEmployee.displayName
            );
        }
    }

    /**
     * @notice Remove an employee from a company
     * @param companyId The ID of the company
     * @param account The address of the employee
     */
    function removeEmployee(
        uint256 companyId,
        address account
    ) external onlyOwnerOrHR(companyId) {
        _requireExistingEmployee(companyId, account);
        if (account == companies[companyId].owner) {
            revert CompanyRegistry__CannotModifyOwner();
        }

        delete companyEmployees[companyId][account];
        _removeEmployeeFromCompanyList(companyId, account);
        _removeCompanyFromUserList(account, companyId);

        emit EmployeeRemoved(companyId, account);
    }

    function updateRole(
        uint256 companyId,
        address account,
        Role newRole
    ) external onlyOwnerOrHR(companyId) {
        _requireExistingEmployee(companyId, account);
        if (account == companies[companyId].owner) {
            revert CompanyRegistry__CannotModifyOwner();
        }
        if (newRole == Role.None || newRole == Role.Owner) {
            revert CompanyRegistry__InvalidRole();
        }

        Role oldRole = companyEmployees[companyId][account].role;
        companyEmployees[companyId][account].role = newRole;

        emit RoleUpdated(companyId, account, oldRole, newRole);
    }

    function _addEmployee(
        uint256 companyId,
        address account,
        Role role,
        string memory displayName
    ) private {
        _requireCompanyExists(companyId);
        if (account == address(0)) {
            revert CompanyRegistry__EmployeeIsZeroAddress();
        }
        if (role == Role.None || role == Role.Owner) {
            revert CompanyRegistry__InvalidRole();
        }
        if (companyEmployees[companyId][account].role != Role.None) {
            revert CompanyRegistry__EmployeeAlreadyExists();
        }

        companyEmployees[companyId][account] = Employee({
            displayName: displayName,
            role: role,
            addedAt: _blockTimestamp()
        });
        companyEmployeeAccounts[companyId].push(account);
        companyEmployeeIndexPlusOne[companyId][
            account
        ] = companyEmployeeAccounts[companyId].length;
        userCompanies[account].push(companyId);
        userCompanyIndexPlusOne[account][companyId] = userCompanies[account]
            .length;

        emit EmployeeAdded(companyId, account, role, _blockTimestamp());
    }

    function _removeEmployeeFromCompanyList(
        uint256 companyId,
        address account
    ) private {
        uint256 indexPlusOne = companyEmployeeIndexPlusOne[companyId][account];
        uint256 lastIndex = companyEmployeeAccounts[companyId].length - 1;
        uint256 index = indexPlusOne - 1;

        if (index != lastIndex) {
            address lastAccount = companyEmployeeAccounts[companyId][lastIndex];
            companyEmployeeAccounts[companyId][index] = lastAccount;
            companyEmployeeIndexPlusOne[companyId][lastAccount] = index + 1;
        }

        companyEmployeeAccounts[companyId].pop();
        delete companyEmployeeIndexPlusOne[companyId][account];
    }

    function _removeCompanyFromUserList(
        address account,
        uint256 companyId
    ) private {
        uint256 indexPlusOne = userCompanyIndexPlusOne[account][companyId];
        uint256 lastIndex = userCompanies[account].length - 1;
        uint256 index = indexPlusOne - 1;

        if (index != lastIndex) {
            uint256 lastCompanyId = userCompanies[account][lastIndex];
            userCompanies[account][index] = lastCompanyId;
            userCompanyIndexPlusOne[account][lastCompanyId] = index + 1;
        }

        userCompanies[account].pop();
        delete userCompanyIndexPlusOne[account][companyId];
    }

    function _requireCompanyExists(uint256 companyId) private view {
        if (companies[companyId].owner == address(0)) {
            revert CompanyRegistry__CompanyDoesNotExist();
        }
    }

    function _requireExistingEmployee(
        uint256 companyId,
        address account
    ) private view {
        _requireCompanyExists(companyId);
        if (account == address(0)) {
            revert CompanyRegistry__EmployeeIsZeroAddress();
        }
        if (companyEmployees[companyId][account].role == Role.None) {
            revert CompanyRegistry__EmployeeDoesNotExist();
        }
    }

    function _requireCompanyOwner(
        uint256 companyId,
        address account
    ) private view {
        _requireCompanyExists(companyId);
        if (companies[companyId].owner != account) {
            revert CompanyRegistry__Unauthorized();
        }
    }

    function _requireCompanyOwnerOrHR(
        uint256 companyId,
        address account
    ) private view {
        _requireCompanyExists(companyId);
        if (
            companies[companyId].owner != account &&
            companyEmployees[companyId][account].role != Role.HR
        ) {
            revert CompanyRegistry__Unauthorized();
        }
    }

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
    function getRole(
        uint256 companyId,
        address account
    ) external view returns (Role) {
        return companyEmployees[companyId][account].role;
    }

    function getUserCompanies(
        address account
    ) external view returns (uint256[] memory) {
        return userCompanies[account];
    }

    function getEmployees(
        uint256 companyId
    ) external view returns (address[] memory) {
        _requireCompanyExists(companyId);
        return companyEmployeeAccounts[companyId];
    }

    function getEmployeeCount(
        uint256 companyId
    ) external view returns (uint256) {
        _requireCompanyExists(companyId);
        return companyEmployeeAccounts[companyId].length;
    }

    function _blockTimestamp() private view returns (uint64) {
        return uint64(block.timestamp);
    }
}
