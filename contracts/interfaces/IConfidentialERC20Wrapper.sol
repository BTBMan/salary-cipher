// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Interfaces ****/
import {IConfidentialSettlementToken} from "./IConfidentialSettlementToken.sol";

interface IConfidentialERC20Wrapper is IConfidentialSettlementToken {
    /// @notice Wraps a public ERC20 amount held by the caller into confidential balance.
    function wrap(uint256 amount) external;
}
