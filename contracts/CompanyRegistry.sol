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
    // Deployment-time admin used to configure globally supported settlement assets.
    address public immutable admin;
    // Next company identifier to assign.
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
    // System contracts allowed to act for a specific company
    mapping(uint256 companyId => mapping(address caller => bool isAuthorized))
        public authorizedCallers;
    // Company-level fixed monthly payroll configuration.
    mapping(uint256 companyId => PayrollConfig payrollConfig)
        private payrollConfigs;
    // Settlement asset selected by each company at creation time.
    mapping(uint256 companyId => SettlementAsset asset)
        private companySettlementAssets;
    // Platform-level supported asset configuration for the current network.
    mapping(SettlementAsset asset => AssetConfig assetConfig)
        private supportedAssets;
    // Treasury vault that actually holds one company's funds.
    mapping(uint256 companyId => address vault) private treasuryVaults;

    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////

    ////////////////////////////////////
    // Modifiers                      //
    ////////////////////////////////////
    /// @notice Restricts execution to the company owner.
    modifier onlyOwner(uint256 companyId) {
        _requireCompanyOwner(companyId, msg.sender);
        _;
    }

    /// @notice Restricts execution to owner, HR, or an authorized system contract.
    modifier onlyOwnerOrHR(uint256 companyId) {
        _requireCompanyOwnerOrHROrAuthorized(companyId, msg.sender);
        _;
    }

    /// @notice Restricts execution to the deployment-time admin.
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert CompanyRegistry__OnlyAdmin();
        }
        _;
    }

    constructor() {
        admin = msg.sender;
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
        string memory name,
        uint8 payrollDayOfMonth,
        SettlementAsset asset
    ) external returns (uint256 companyId) {
        if (bytes(name).length == 0) {
            revert CompanyRegistry__CompanyNameIsEmpty();
        }
        _validatePayrollDay(payrollDayOfMonth);
        _requireEnabledAsset(asset);

        companyId = nextCompanyId;

        companies[companyId] = Company({
            name: name,
            owner: msg.sender,
            createdAt: _blockTimestamp()
        });
        payrollConfigs[companyId] = PayrollConfig({
            dayOfMonth: payrollDayOfMonth,
            initialized: true
        });
        companySettlementAssets[companyId] = asset;
        companyEmployees[companyId][msg.sender] = Employee({
            displayName: "Owner",
            role: Role.Owner,
            payoutWallet: msg.sender,
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
        emit PayrollConfigUpdated(companyId, payrollDayOfMonth);
        emit SettlementAssetSelected(companyId, asset);
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

    function setAuthorizedCaller(
        uint256 companyId,
        address caller,
        bool authorized
    ) external onlyOwner(companyId) {
        if (caller == address(0)) {
            revert CompanyRegistry__InvalidCaller();
        }

        authorizedCallers[companyId][caller] = authorized;
    }

    /// @inheritdoc ICompanyRegistry
    function setPayrollConfig(
        uint256 companyId,
        uint8 dayOfMonth
    ) external onlyOwner(companyId) {
        _validatePayrollDay(dayOfMonth);

        payrollConfigs[companyId] = PayrollConfig({
            dayOfMonth: dayOfMonth,
            initialized: true
        });

        emit PayrollConfigUpdated(companyId, dayOfMonth);
    }

    /// @inheritdoc ICompanyRegistry
    function setPayoutWallet(uint256 companyId, address payoutWallet) external {
        _requireExistingEmployee(companyId, msg.sender);
        if (payoutWallet == address(0)) {
            revert CompanyRegistry__InvalidAddress();
        }

        companyEmployees[companyId][msg.sender].payoutWallet = payoutWallet;

        emit PayoutWalletUpdated(companyId, msg.sender, payoutWallet);
    }

    /// @inheritdoc ICompanyRegistry
    function setSupportedAsset(
        SettlementAsset asset,
        address underlyingToken,
        address settlementToken,
        bool enabled,
        uint8 decimals
    ) external onlyAdmin {
        if (underlyingToken == address(0) || settlementToken == address(0)) {
            revert CompanyRegistry__InvalidAddress();
        }
        if (decimals == 0) {
            revert CompanyRegistry__InvalidSettlementAsset();
        }

        supportedAssets[asset] = AssetConfig({
            underlyingToken: underlyingToken,
            settlementToken: settlementToken,
            enabled: enabled,
            decimals: decimals
        });

        emit SupportedAssetUpdated(
            asset,
            underlyingToken,
            settlementToken,
            enabled,
            decimals
        );
    }

    /// @inheritdoc ICompanyRegistry
    function setTreasuryVault(
        uint256 companyId,
        address vault
    ) external onlyOwner(companyId) {
        if (vault == address(0)) {
            revert CompanyRegistry__InvalidAddress();
        }

        treasuryVaults[companyId] = vault;

        emit TreasuryVaultUpdated(companyId, vault);
    }

    /// @dev Shared insert path used by both single and batch employee creation.
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
            payoutWallet: account,
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

    /// @dev Removes one account from the enumerable company member list via swap-and-pop.
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

    /// @dev Removes one company id from the reverse user membership list via swap-and-pop.
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

    /// @dev Reverts if the company id has not been created yet.
    function _requireCompanyExists(uint256 companyId) private view {
        if (companies[companyId].owner == address(0)) {
            revert CompanyRegistry__CompanyDoesNotExist();
        }
    }

    /// @dev Reverts if the account is not an active employee entry for the company.
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

    /// @dev Reverts unless the account is the recorded company owner.
    function _requireCompanyOwner(
        uint256 companyId,
        address account
    ) private view {
        _requireCompanyExists(companyId);
        if (companies[companyId].owner != account) {
            revert CompanyRegistry__Unauthorized();
        }
    }

    /// @dev Reverts unless the account is owner or HR.
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

    /// @dev Reverts unless the account is owner, HR, or an authorized system contract.
    function _requireCompanyOwnerOrHROrAuthorized(
        uint256 companyId,
        address account
    ) private view {
        _requireCompanyExists(companyId);
        if (
            companies[companyId].owner != account &&
            companyEmployees[companyId][account].role != Role.HR &&
            !authorizedCallers[companyId][account]
        ) {
            revert CompanyRegistry__Unauthorized();
        }
    }

    /// @dev Reverts unless the monthly payroll day falls within the Gregorian day range.
    function _validatePayrollDay(uint8 dayOfMonth) private pure {
        if (dayOfMonth == 0 || dayOfMonth > 31) {
            revert CompanyRegistry__InvalidPayrollConfig();
        }
    }

    /// @dev Reverts unless the settlement asset is enabled on the current network.
    function _requireEnabledAsset(SettlementAsset asset) private view {
        if (!supportedAssets[asset].enabled) {
            revert CompanyRegistry__AssetNotEnabled();
        }
    }

    ////////////////////////////////////
    // Getter functions               //
    ////////////////////////////////////
    /// @inheritdoc ICompanyRegistry
    function getRole(
        uint256 companyId,
        address account
    ) external view returns (Role) {
        return companyEmployees[companyId][account].role;
    }

    /// @inheritdoc ICompanyRegistry
    function getUserCompanies(
        address account
    ) external view returns (uint256[] memory) {
        return userCompanies[account];
    }

    /// @inheritdoc ICompanyRegistry
    function getEmployees(
        uint256 companyId
    ) external view returns (address[] memory) {
        _requireCompanyExists(companyId);
        return companyEmployeeAccounts[companyId];
    }

    /// @inheritdoc ICompanyRegistry
    function getEmployeeCount(
        uint256 companyId
    ) external view returns (uint256) {
        _requireCompanyExists(companyId);
        return companyEmployeeAccounts[companyId].length;
    }

    /// @inheritdoc ICompanyRegistry
    function getCompany(
        uint256 companyId
    ) external view returns (Company memory companyInfo) {
        companyInfo = companies[companyId];
    }

    /// @inheritdoc ICompanyRegistry
    function getPayrollConfig(
        uint256 companyId
    ) external view returns (PayrollConfig memory payrollConfig) {
        _requireCompanyExists(companyId);
        payrollConfig = payrollConfigs[companyId];
    }

    /// @inheritdoc ICompanyRegistry
    function getCompanySettlementAsset(
        uint256 companyId
    ) external view returns (SettlementAsset asset) {
        _requireCompanyExists(companyId);
        asset = companySettlementAssets[companyId];
    }

    /// @inheritdoc ICompanyRegistry
    function getAssetConfig(
        SettlementAsset asset
    ) external view returns (AssetConfig memory assetConfig) {
        assetConfig = supportedAssets[asset];
    }

    /// @inheritdoc ICompanyRegistry
    function getEmployee(
        uint256 companyId,
        address account
    ) external view returns (Employee memory employeeInfo) {
        _requireExistingEmployee(companyId, account);
        employeeInfo = companyEmployees[companyId][account];
    }

    /// @inheritdoc ICompanyRegistry
    function getPayoutWallet(
        uint256 companyId,
        address account
    ) external view returns (address payoutWallet) {
        _requireExistingEmployee(companyId, account);
        payoutWallet = companyEmployees[companyId][account].payoutWallet;
    }

    /// @inheritdoc ICompanyRegistry
    function getSettlementToken(
        uint256 companyId
    ) external view returns (address token) {
        _requireCompanyExists(companyId);
        token = supportedAssets[companySettlementAssets[companyId]]
            .settlementToken;
    }

    /// @inheritdoc ICompanyRegistry
    function getUnderlyingToken(
        uint256 companyId
    ) external view returns (address token) {
        _requireCompanyExists(companyId);
        token = supportedAssets[companySettlementAssets[companyId]]
            .underlyingToken;
    }

    /// @inheritdoc ICompanyRegistry
    function getTreasuryVault(
        uint256 companyId
    ) external view returns (address vault) {
        _requireCompanyExists(companyId);
        vault = treasuryVaults[companyId];
    }

    /// @dev Returns the current block timestamp in the contract-wide compact format.
    function _blockTimestamp() private view returns (uint64) {
        return uint64(block.timestamp);
    }
}
