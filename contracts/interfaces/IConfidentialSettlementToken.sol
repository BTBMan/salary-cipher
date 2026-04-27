// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/* Imports *******/
import {euint128} from "@fhevm/solidity/lib/FHE.sol";

interface IConfidentialSettlementToken {
    /// @notice Transfers confidential funds from the caller to a destination wallet.
    function confidentialTransfer(address to, euint128 amount) external;
}
