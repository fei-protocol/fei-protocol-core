// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IAnglePoolManager.sol";

// Angle StableMaster contract
interface IAngleStableMaster {
    function agToken() external returns (address);

    function mint(
        uint256 amount,
        address user,
        IAnglePoolManager poolManager,
        uint256 minStableAmount
    ) external;

    function burn(
        uint256 amount,
        address burner,
        address dest,
        IAnglePoolManager poolManager,
        uint256 minCollatAmount
    ) external;

    function unpause(bytes32 agent, IAnglePoolManager poolManager) external;
}
