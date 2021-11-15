// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MockERC20.sol";

contract MockAngleStableMaster {
    MockERC20 public agToken;
    uint256 public usdPerAgToken;
    uint256 public feeBp = 30; // 0.3% fee

    constructor(MockERC20 _agToken, uint256 _usdPerAgToken) {
        agToken = _agToken;
        usdPerAgToken = _usdPerAgToken;
    }

    function setFee(uint256 _fee) public {
        feeBp = _fee;
    }

    function mint(
        uint256 amount,
        address user,
        address poolManager,
        uint256
    ) external {
        uint256 amountAfterFee = (amount * (10_000 - feeBp)) / (usdPerAgToken * 10_000);
        SafeERC20.safeTransferFrom(agToken, msg.sender, address(this), amount);
        agToken.mint(user, amountAfterFee);
    }

    function burn(
        uint256 amount,
        address burner,
        address dest,
        address poolManager,
        uint256
    ) external {
        uint256 amountAfterFee = (amount * usdPerAgToken * (10_000 - feeBp)) / 10_000;
        SafeERC20.safeTransfer(agToken, dest, amountAfterFee);
        agToken.mockBurn(burner, amount);
    }
}
