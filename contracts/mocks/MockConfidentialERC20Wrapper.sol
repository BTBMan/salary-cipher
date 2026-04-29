// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC7984, ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

/**
 * @title MockConfidentialERC20Wrapper
 * @author BTBMan
 * @notice Test-only confidential wrapper built directly on OpenZeppelin's ERC7984ERC20Wrapper example.
 * @dev The contract keeps the production-facing behavior aligned with OpenZeppelin while remaining easy to deploy in tests.
 */
contract MockConfidentialERC20Wrapper is
    ERC7984ERC20Wrapper,
    ZamaEthereumConfig
{
    /**
     * @notice Creates a test confidential wrapper for one underlying ERC20 token.
     * @param underlyingTokenAddress The ERC20 token wrapped into confidential balances.
     */
    constructor(
        address underlyingTokenAddress
    )
        ERC7984ERC20Wrapper(IERC20(underlyingTokenAddress))
        ERC7984(
            "Mock Confidential USD Coin",
            "mcUSDC",
            ""
        )
    {}
}
