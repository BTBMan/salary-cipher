// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {FHE, euint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";
import {ICompanyTreasuryVault} from "./interfaces/ICompanyTreasuryVault.sol";
import {IConfidentialERC20Wrapper} from "./interfaces/IConfidentialERC20Wrapper.sol";
import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";

/**
 * @title CompanyTreasuryVault
 * @author BTBMan
 * @notice Holds one company's payroll funds and executes confidential transfers on behalf of SalaryCipherCore.
 * @dev Public ERC20 funds are deposited here, optionally wrapped into a confidential token, then transferred out for payroll.
 */
contract CompanyTreasuryVault is ICompanyTreasuryVault, ZamaEthereumConfig {
    // Immutable company namespace served by this vault.
    uint256 public immutable companyId;
    // Registry used to resolve company owner and HR access.
    ICompanyRegistry public immutable companyRegistry;
    // Public ERC20 used as the funding asset before wrapping.
    IERC20Minimal public immutable underlyingToken;
    // Confidential wrapper / settlement token used for payroll transfers.
    IConfidentialERC20Wrapper public immutable settlementToken;
    // The singleton payroll core allowed to move confidential funds out of the vault.
    address public immutable salaryCipherCore;

    // Encrypted bookkeeping balance representing wrapped payroll funds available for future transfers.
    euint128 public confidentialBalance;

    /// @notice Restricts execution to the company owner.
    modifier onlyOwner() {
        if (companyRegistry.getRole(companyId, msg.sender) != ICompanyRegistry.Role.Owner) {
            revert CompanyTreasuryVault__Unauthorized();
        }
        _;
    }

    /// @notice Restricts execution to the configured SalaryCipherCore.
    modifier onlySalaryCipherCore() {
        if (msg.sender != salaryCipherCore) {
            revert CompanyTreasuryVault__Unauthorized();
        }
        _;
    }

    /**
     * @notice Creates a dedicated treasury vault for one company.
     * @param companyId_ The company namespace served by this vault.
     * @param companyRegistryAddress The deployed CompanyRegistry address.
     * @param underlyingTokenAddress The public ERC20 used for funding.
     * @param settlementTokenAddress The confidential wrapper token used for payroll.
     * @param salaryCipherCoreAddress The payroll core authorized to trigger confidential transfers.
     */
    constructor(
        uint256 companyId_,
        address companyRegistryAddress,
        address underlyingTokenAddress,
        address settlementTokenAddress,
        address salaryCipherCoreAddress
    ) {
        if (
            companyRegistryAddress == address(0) ||
            underlyingTokenAddress == address(0) ||
            settlementTokenAddress == address(0) ||
            salaryCipherCoreAddress == address(0)
        ) {
            revert CompanyTreasuryVault__InvalidAddress();
        }

        companyId = companyId_;
        companyRegistry = ICompanyRegistry(companyRegistryAddress);
        underlyingToken = IERC20Minimal(underlyingTokenAddress);
        settlementToken = IConfidentialERC20Wrapper(settlementTokenAddress);
        salaryCipherCore = salaryCipherCoreAddress;
    }

    /// @inheritdoc ICompanyTreasuryVault
    function depositUnderlying(uint256 amount) external onlyOwner {
        if (amount == 0) {
            revert CompanyTreasuryVault__InvalidAmount();
        }
        if (
            !underlyingToken.transferFrom(msg.sender, address(this), amount)
        ) {
            revert CompanyTreasuryVault__TransferFailed();
        }

        emit UnderlyingDeposited(companyId, msg.sender, amount);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function wrapUnderlying(uint256 amount) external onlyOwner {
        if (amount == 0) {
            revert CompanyTreasuryVault__InvalidAmount();
        }
        if (!underlyingToken.approve(address(settlementToken), amount)) {
            revert CompanyTreasuryVault__TransferFailed();
        }

        settlementToken.wrap(amount);
        confidentialBalance = FHE.add(confidentialBalance, uint128(amount));
        _grantManagerBalanceAccess();

        emit UnderlyingWrapped(companyId, amount);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function payrollTransfer(
        address to,
        euint128 amount
    ) external onlySalaryCipherCore {
        if (to == address(0)) {
            revert CompanyTreasuryVault__InvalidAddress();
        }

        // The vault mirrors its wrapped balance in encrypted form so managers can inspect remaining payroll funds
        // without exposing the underlying number publicly.
        confidentialBalance = FHE.sub(confidentialBalance, amount);
        FHE.allow(amount, address(settlementToken));
        settlementToken.confidentialTransfer(to, amount);
        _grantManagerBalanceAccess();

        emit PayrollTransferred(companyId, to, block.timestamp);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function withdrawUnusedUnderlying(
        uint256 amount,
        address to
    ) external onlyOwner {
        if (amount == 0) {
            revert CompanyTreasuryVault__InvalidAmount();
        }
        if (to == address(0)) {
            revert CompanyTreasuryVault__InvalidAddress();
        }
        if (!underlyingToken.transfer(to, amount)) {
            revert CompanyTreasuryVault__TransferFailed();
        }

        emit UnusedUnderlyingWithdrawn(companyId, to, amount);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function getConfidentialBalance() external returns (euint128) {
        euint128 balance = confidentialBalance;
        FHE.allowThis(balance);
        _grantManagerAccess(balance);
        return balance;
    }

    /// @dev Refreshes FHE access for the encrypted vault balance handle after each state change.
    function _grantManagerBalanceAccess() private {
        FHE.allowThis(confidentialBalance);
        _grantManagerAccess(confidentialBalance);
    }

    /// @dev Grants an encrypted value handle to the current owner and HR members for the company.
    function _grantManagerAccess(euint128 value) private {
        address[] memory employees = companyRegistry.getEmployees(companyId);
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            ICompanyRegistry.Role role = companyRegistry.getRole(companyId, employee);
            if (
                role == ICompanyRegistry.Role.Owner ||
                role == ICompanyRegistry.Role.HR
            ) {
                FHE.allow(value, employee);
            }
        }
    }
}
