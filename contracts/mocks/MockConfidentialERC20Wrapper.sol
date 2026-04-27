// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {FHE, euint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/* Interfaces ****/
import {IConfidentialERC20Wrapper} from "../interfaces/IConfidentialERC20Wrapper.sol";
import {IERC20Minimal} from "../interfaces/IERC20Minimal.sol";

/**
 * @title MockConfidentialERC20Wrapper
 * @author BTBMan
 * @notice Test-only confidential wrapper that mirrors balances with FHE handles.
 */
contract MockConfidentialERC20Wrapper is
    IConfidentialERC20Wrapper,
    ZamaEthereumConfig
{
    IERC20Minimal public immutable underlyingToken;
    mapping(address account => euint128 balance) public balances;

    constructor(address underlyingTokenAddress) {
        underlyingToken = IERC20Minimal(underlyingTokenAddress);
    }

    /// @inheritdoc IConfidentialERC20Wrapper
    function wrap(uint256 amount) external {
        require(
            underlyingToken.transferFrom(msg.sender, address(this), amount),
            "WRAP_TRANSFER_FAILED"
        );

        balances[msg.sender] = FHE.add(balances[msg.sender], uint128(amount));
        _grantBalanceAccess(msg.sender);
    }

    /// @notice Transfers confidential funds between two addresses inside the mock wrapper ledger.
    function confidentialTransfer(address to, euint128 amount) external {
        require(to != address(0), "ZERO_ADDRESS");

        balances[msg.sender] = FHE.sub(balances[msg.sender], amount);
        balances[to] = FHE.add(balances[to], amount);

        _grantBalanceAccess(msg.sender);
        _grantBalanceAccess(to);
    }

    /// @dev Refreshes access for one account balance so tests and other contracts can decrypt it.
    function _grantBalanceAccess(address account) private {
        FHE.allowThis(balances[account]);
        FHE.allow(balances[account], account);
    }
}
