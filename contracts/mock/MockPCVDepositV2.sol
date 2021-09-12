// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "../pcv/IPCVDeposit.sol";

contract MockPCVDepositV2 is IPCVDeposit, CoreRef {

    address public override balanceReportedIn;

    uint256 private resistantBalance;
    uint256 private resistantProtocolOwnedFei;

    constructor(
      address _core,
      address _token,
      uint256 _resistantBalance,
      uint256 _resistantProtocolOwnedFei
    ) CoreRef(_core) {
        balanceReportedIn = _token;
        resistantBalance = _resistantBalance;
        resistantProtocolOwnedFei = _resistantProtocolOwnedFei;
    }

    function set(uint256 _resistantBalance, uint256 _resistantProtocolOwnedFei) public {
        resistantBalance = _resistantBalance;
        resistantProtocolOwnedFei = _resistantProtocolOwnedFei;
    }

    // gets the resistant token balance and protocol owned fei of this deposit
    function resistantBalanceAndFei() external view override returns (uint256, uint256) {
        return (resistantBalance, resistantProtocolOwnedFei);
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
