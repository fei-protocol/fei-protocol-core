// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IPoolManager {
    function token() external returns (address);
}

interface IMockERC20 is IERC20 {
    function mint(address account, uint256 amount) external returns (bool);
    function burn(address account, uint256 amount) external returns (bool);
}

contract MockAngleStableMaster {
    IMockERC20 public agToken;

	constructor(IMockERC20 _agToken) {
		agToken = _agToken;
	}

    function mint(
        uint256 amount,
        address user,
        IPoolManager poolManager,
        uint256
    ) external {
        SafeERC20.safeTransferFrom(IERC20(poolManager.token()), msg.sender, address(this), amount);
        agToken.mint(user, amount);
    }

    function burn(
        uint256 amount,
        address,
        address dest,
        IPoolManager poolManager,
        uint256
    ) external {
        SafeERC20.safeTransfer(IERC20(poolManager.token()), dest, amount);
    }
}