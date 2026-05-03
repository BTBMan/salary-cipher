// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Interfaces ****/
import {ICompanyRegistry} from "./ICompanyRegistry.sol";

interface ISalaryCipherFactory {
    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when a company and its treasury vault are created in one transaction.
    event CompanyCreatedWithVault(
        uint256 indexed companyId,
        address indexed owner,
        address indexed vault
    );

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error SalaryCipherFactory__InvalidAddress();

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /// @notice Creates a company, deploys its treasury vault, and authorizes SalaryCipherCore.
    function createCompany(
        string memory name,
        uint8 payrollDayOfMonth,
        ICompanyRegistry.SettlementAsset asset
    ) external returns (uint256 companyId, address vault);
}
