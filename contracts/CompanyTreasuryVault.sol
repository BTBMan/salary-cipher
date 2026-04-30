// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/interfaces/IERC7984ERC20Wrapper.sol";

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";
import {ICompanyTreasuryVault} from "./interfaces/ICompanyTreasuryVault.sol";
import {IERC7984ERC20WrapperInternal} from "./interfaces/IERC7984ERC20WrapperInternal.sol";

/**
 * @title CompanyTreasuryVault
 * @author BTBMan
 * @notice Holds one company's payroll funds and executes confidential transfers on behalf of SalaryCipherCore.
 * @dev Public ERC20 funds are deposited here, optionally wrapped into a confidential token, then transferred out for payroll.
 */
contract CompanyTreasuryVault is ICompanyTreasuryVault, ZamaEthereumConfig {
    using SafeERC20 for IERC20;

    // Immutable company namespace served by this vault.
    uint256 public immutable companyId;
    // Registry used to resolve company owner and HR access.
    ICompanyRegistry public immutable companyRegistry;
    // Public ERC20 used as the funding asset before wrapping.
    IERC20 public immutable underlyingToken;
    // Confidential wrapper / settlement token used for payroll transfers.
    IERC7984ERC20WrapperInternal public immutable settlementToken;
    // The singleton payroll core allowed to move confidential funds out of the vault.
    address public immutable salaryCipherCore;

    /// @notice Restricts execution to the company owner.
    modifier onlyOwner() {
        if (
            companyRegistry.getRole(companyId, msg.sender) !=
            ICompanyRegistry.Role.Owner
        ) {
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
        underlyingToken = IERC20(underlyingTokenAddress);
        settlementToken = IERC7984ERC20WrapperInternal(settlementTokenAddress);
        salaryCipherCore = salaryCipherCoreAddress;
    }

    /// @inheritdoc ICompanyTreasuryVault
    function depositUnderlying(uint256 amount) external onlyOwner {
        if (amount == 0) {
            revert CompanyTreasuryVault__InvalidAmount();
        }
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit UnderlyingDeposited(companyId, msg.sender, amount);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function wrapUnderlying(uint256 amount) external onlyOwner {
        if (amount == 0) {
            revert CompanyTreasuryVault__InvalidAmount();
        }
        SafeERC20.forceApprove(
            underlyingToken,
            address(settlementToken),
            amount
        );

        settlementToken.wrap(address(this), amount);

        emit UnderlyingWrapped(companyId, amount);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function payrollTransfer(
        address to,
        euint64 amount
    ) external onlySalaryCipherCore {
        if (to == address(0)) {
            revert CompanyTreasuryVault__InvalidAddress();
        }

        FHE.allow(amount, address(settlementToken));
        settlementToken.confidentialTransfer(to, amount);

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
        underlyingToken.safeTransfer(to, amount);

        emit UnusedUnderlyingWithdrawn(companyId, to, amount);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function refundAllWrappedUnderlying()
        external
        onlyOwner
        returns (bytes32 unwrapRequestId)
    {
        euint64 wrappedBalance = settlementToken.confidentialBalanceOf(
            address(this)
        );
        if (!FHE.isInitialized(wrappedBalance)) {
            revert CompanyTreasuryVault__InvalidAmount();
        }

        unwrapRequestId = settlementToken.unwrap(
            address(this),
            msg.sender,
            wrappedBalance
        );

        emit UnderlyingUnwrapRequested(companyId, msg.sender, unwrapRequestId);
    }

    /// @inheritdoc ICompanyTreasuryVault
    function getConfidentialBalance() external returns (euint64) {
        euint64 balance = settlementToken.confidentialBalanceOf(address(this));
        _grantManagerAccess(balance);
        return balance;
    }

    /// @dev Grants an encrypted value handle to the current owner and HR members for the company.
    function _grantManagerAccess(euint64 value) private {
        address[] memory employees = companyRegistry.getEmployees(companyId);
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            ICompanyRegistry.Role role = companyRegistry.getRole(
                companyId,
                employee
            );
            if (
                role == ICompanyRegistry.Role.Owner ||
                role == ICompanyRegistry.Role.HR
            ) {
                FHE.allow(value, employee);
            }
        }
    }
}
