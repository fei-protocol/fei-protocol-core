// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./ReserveStabilizer.sol";

interface ITribe is IERC20 {
    function mint(address to, uint256 amount) external;
    function setMinter(address newMinter) external;
}

/// @title implementation for a TRIBE Reserve Stabilizer
/// @author Fei Protocol
contract TribeReserveStabilizer is ReserveStabilizer {

    constructor(
        address _core,
        address _oracle,
        uint256 _usdPerFeiBasisPoints
    ) public ReserveStabilizer(_core, _oracle, IERC20(address(0)), _usdPerFeiBasisPoints) {}

    /// @dev reverts because this contract doesn't hold any TRIBE
    function withdraw(address, uint256) external override {
        revert("TribeReserveStabilizer: nothing to withdraw");
    }

    /// @notice returns the amount of the held TRIBE
    function balance() public view override returns(uint256) {
        return tribeBalance();
    }

    /// @notice mints TRIBE to the target address
    /// @param to the address to send TRIBE to
    /// @param amount the amount of TRIBE to send
    function mint(address to, uint256 amount) external onlyGovernor {
        _mint(to, amount);
    }

    /// @notice changes the TRIBE minter address
    /// @param newMinter the new minter address
    function setMinter(address newMinter) external onlyGovernor {
        ITribe _tribe = ITribe(address(tribe()));
        _tribe.setMinter(newMinter);
    }

    function _transfer(address to, uint256 amount) internal override {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        ITribe _tribe = ITribe(address(tribe()));
        _tribe.mint(to, amount);
    }
}
