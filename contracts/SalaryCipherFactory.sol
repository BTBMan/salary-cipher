// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Interfaces ****/
import {ICompanyRegistry} from "./interfaces/ICompanyRegistry.sol";
import {ISalaryCipherFactory} from "./interfaces/ISalaryCipherFactory.sol";

/* Contracts ****/
import {CompanyTreasuryVault} from "./CompanyTreasuryVault.sol";

/**
 * @title SalaryCipherFactory
 * @author BTBMan
 * @notice Creates fully initialized company namespaces for the payroll platform.
 * @dev The factory is the only frontend-facing creation entrypoint. It keeps company, vault, and payroll-core wiring atomic.
 */
contract SalaryCipherFactory is ISalaryCipherFactory {
    // Registry that stores company metadata and role assignments.
    ICompanyRegistry public immutable companyRegistry;
    // Payroll core authorized to move confidential funds out of company vaults.
    address public immutable salaryCipherCore;

    /**
     * @notice Binds the factory to the already deployed platform registry and payroll core.
     * @param companyRegistryAddress The deployed CompanyRegistry address.
     * @param salaryCipherCoreAddress The deployed SalaryCipherCore address.
     */
    constructor(
        address companyRegistryAddress,
        address salaryCipherCoreAddress
    ) {
        if (
            companyRegistryAddress == address(0) ||
            salaryCipherCoreAddress == address(0)
        ) {
            revert SalaryCipherFactory__InvalidAddress();
        }

        companyRegistry = ICompanyRegistry(companyRegistryAddress);
        salaryCipherCore = salaryCipherCoreAddress;
    }

    /// @inheritdoc ISalaryCipherFactory
    function createCompany(
        string memory name,
        uint8 payrollDayOfMonth,
        ICompanyRegistry.SettlementAsset asset
    ) external returns (uint256 companyId, address vault) {
        companyId = companyRegistry.createCompanyFor(
            msg.sender,
            name,
            payrollDayOfMonth,
            asset
        );
        vault = address(
            new CompanyTreasuryVault(
                companyId,
                address(companyRegistry),
                salaryCipherCore
            )
        );

        companyRegistry.setTreasuryVault(companyId, vault);
        companyRegistry.setAuthorizedCaller(companyId, salaryCipherCore, true);

        emit CompanyCreatedWithVault(companyId, msg.sender, vault);
    }
}
