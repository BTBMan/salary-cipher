// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {euint64} from "@fhevm/solidity/lib/FHE.sol";

interface ICompanyTreasuryVault {
    ////////////////////////////////////
    // Events                         //
    ////////////////////////////////////
    /// @notice Emitted when public underlying funds are deposited into the vault.
    event UnderlyingDeposited(
        uint256 indexed companyId,
        address indexed from,
        uint256 amount
    );
    /// @notice Emitted when public underlying funds are wrapped into confidential assets.
    event UnderlyingWrapped(uint256 indexed companyId, uint256 amount);
    /// @notice Emitted when payroll is transferred to one payout wallet.
    event PayrollTransferred(
        uint256 indexed companyId,
        address indexed to,
        uint256 executedAt
    );
    /// @notice Emitted when unused public underlying funds are withdrawn by the company owner.
    event UnusedUnderlyingWithdrawn(
        uint256 indexed companyId,
        address indexed to,
        uint256 amount
    );

    ////////////////////////////////////
    // Errors                         //
    ////////////////////////////////////
    error CompanyTreasuryVault__Unauthorized();
    error CompanyTreasuryVault__InvalidAddress();
    error CompanyTreasuryVault__InvalidAmount();
    error CompanyTreasuryVault__TransferFailed();

    ////////////////////////////////////
    // Functions                      //
    ////////////////////////////////////
    /// @notice Deposits public underlying tokens into the vault.
    function depositUnderlying(uint256 amount) external;

    /// @notice Wraps public underlying tokens into the company's confidential settlement asset.
    function wrapUnderlying(uint256 amount) external;

    /// @notice Transfers confidential payroll funds to one employee payout wallet.
    function payrollTransfer(address to, euint64 amount) external;

    /// @notice Withdraws unused public underlying funds back to a plain address.
    function withdrawUnusedUnderlying(uint256 amount, address to) external;

    /// @notice Returns the encrypted balance handle representing wrapped payroll funds held by the vault.
    function getConfidentialBalance() external returns (euint64);
}
