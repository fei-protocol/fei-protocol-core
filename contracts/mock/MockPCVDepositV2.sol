// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../pcv/IPCVDepositV2.sol";

contract MockPCVDepositV2 is IPCVDepositV2 {

    address public override balanceReportedIn;
    uint256 public override resistantBalance;
    uint256 public override resistantProtocolOwnedFei;

    constructor(address _token, uint256 _resistantBalance, uint256 _resistantProtocolOwnedFei) {
        balanceReportedIn = _token;
        resistantBalance = _resistantBalance;
        resistantProtocolOwnedFei = _resistantProtocolOwnedFei;
    }

    function set(uint256 _resistantBalance, uint256 _resistantProtocolOwnedFei) public {
        resistantBalance = _resistantBalance;
        resistantProtocolOwnedFei = _resistantProtocolOwnedFei;
    }

    // IPCVDeposit V1
    function deposit() external override {}
    function withdraw(address to, uint256 amount) external override {}
    function withdrawERC20(address token, address to, uint256 amount) external override {}
    function withdrawETH(address payable to, uint256 amount) external override {}
    function balance() external override view returns (uint256) {
        return resistantBalance;
    }
}
