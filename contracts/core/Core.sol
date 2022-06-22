// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Permissions.sol";
import "./ICore.sol";
import "../fei/Fei.sol";
import "../tribe/Tribe.sol";

/// @title Source of truth for Fei Protocol
/// @author Fei Protocol
/// @notice maintains roles, access control, fei, tribe, genesisGroup, and the TRIBE treasury
contract Core is ICore, Permissions, Initializable {
    /// @notice the address of the FEI contract
    IFei public override fei;

    /// @notice the address of the TRIBE contract
    IERC20 public override tribe;

    function init() external override initializer {
        _setupGovernor(msg.sender);

        Fei _fei = new Fei(address(this));
        _setFei(address(_fei));

        Tribe _tribe = new Tribe(address(this), msg.sender);
        _setTribe(address(_tribe));
    }

    /// @notice sets Fei address to a new address
    /// @param token new fei address
    function setFei(address token) external override onlyGovernor {
        _setFei(token);
    }

    /// @notice sets Tribe address to a new address
    /// @param token new tribe address
    function setTribe(address token) external override onlyGovernor {
        _setTribe(token);
    }

    /// @notice sends TRIBE tokens from treasury to an address
    /// @param to the address to send TRIBE to
    /// @param amount the amount of TRIBE to send
    function allocateTribe(address to, uint256 amount) external override onlyGovernor {
        IERC20 _tribe = tribe;
        require(_tribe.balanceOf(address(this)) >= amount, "Core: Not enough Tribe");

        _tribe.transfer(to, amount);

        emit TribeAllocation(to, amount);
    }

    function _setFei(address token) internal {
        fei = IFei(token);
        emit FeiUpdate(token);
    }

    function _setTribe(address token) internal {
        tribe = IERC20(token);
        emit TribeUpdate(token);
    }
}
