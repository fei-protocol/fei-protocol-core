// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ILUSDSwapper.sol";
import "./IBAMM.sol";
import "../IPCVDeposit.sol";
import "../../refs/CoreRef.sol";

contract LUSDSwapper is ILUSDSwapper, CoreRef {

    IBAMM public immutable bamm;
    IPCVDeposit public lusdDeposit;
    address public ethDeposit;

    constructor (address _core, IBAMM _bamm, IPCVDeposit _lusdDeposit, address _ethDeposit) CoreRef(_core) {
        bamm = _bamm;

        lusdDeposit = _lusdDeposit;
        ethDeposit = _ethDeposit;

        IERC20(lusdDeposit.balanceReportedIn()).approve(address(_bamm), type(uint256).max);
    }

    function swapLUSD(uint256 lusdAmount, uint256 minEthReturn) external override whenNotPaused onlyGovernorOrAdmin {
        lusdDeposit.withdraw(address(this), lusdAmount);
        bamm.swap(lusdAmount, minEthReturn, ethDeposit);
        // TODO deposit ethDeposit?
    }

    // TODO setters for targets?
}