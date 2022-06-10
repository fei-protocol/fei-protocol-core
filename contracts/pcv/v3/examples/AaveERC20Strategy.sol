// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../PCVStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract AaveERC20Strategy is PCVStrategy {
    using SafeERC20 for IERC20;

    address private token;
    address private atoken;

    constructor(address _token, address _atoken) {
        token = _token;
        atoken = _atoken;
    }

    function asset() external view override returns (address) {
        return token;
    }

    // todo: inherit solmate ERC4626 mixin and override the needed functions
    // function function totalAssets() public view virtual returns (uint256);
    //  -> return the atoken.balanceof(this)
    // function beforeWithdraw(uint256 assets, uint256 shares) internal virtual {}
    //  -> atoken.withdraw
    // function afterDeposit(uint256 assets, uint256 shares) internal virtual {}
    //  -> atoken.deposit

    // this implementation keeps all stkAAVE LM rewards for the vault,
    // a multi-token would also be possible with stkAAVE claiming and keeping
    // an index of stkAAVE for each depositors
}
