// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/interfaces/IERC7984ERC20Wrapper.sol";

/**
 * @title IERC7984ERC20WrapperInternal
 * @author BTBMan
 * @notice OpenZeppelin's ERC7984 wrapper interface extended with an internal unwrap method.
 * @dev Local extension for the wrapper overload that accepts an in-contract encrypted amount handle.
 */
interface IERC7984ERC20WrapperInternal is IERC7984ERC20Wrapper {
    function unwrap(
        address from,
        address to,
        euint64 amount
    ) external returns (bytes32);
}
