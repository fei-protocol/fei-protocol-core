//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 @title Contract to exchange REPT-b for FEI
*/
contract REPTbRedeemer {
    using SafeERC20 for IERC20;

    event Exchange(address indexed from, address indexed to, uint256 amount);

    IERC20 public immutable reptB;
    IERC20 public immutable fei;

    constructor(IERC20 _reptB, IERC20 _fei) {
        reptB = _reptB;
        fei = _fei;
    }

    /// @notice call to exchange REPT-b for FEI
    /// @param to the destination address
    /// @param amount the amount to exchange
    function exchange(address to, uint256 amount) public {
        reptB.safeTransferFrom(msg.sender, address(this), amount);
        fei.safeTransfer(to, amount);
        emit Exchange(msg.sender, to, amount);
    }
}