// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @author BTBMan
 * @notice Test ERC20 built on OpenZeppelin's implementation for treasury funding flows.
 */
contract MockERC20 is ERC20 {
    uint8 private immutable tokenDecimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        tokenDecimals = decimals_;
    }

    /// @notice Mints tokens for test setup.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Keeps test token decimals aligned with the configured deployment value.
    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}
