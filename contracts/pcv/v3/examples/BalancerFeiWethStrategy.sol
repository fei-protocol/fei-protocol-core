// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../PCVStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract AaveERC20Strategy is PCVStrategy {
    using SafeERC20 for IERC20;

    address private constant B70WETH30FEI = 0x4da27a545c0c5B758a6BA100e3a049001de870f5;
    address private constant WETH = 0x4da27a545c0c5B758a6BA100e3a049001de870f5;
    address private constant FEI = 0x4da27a545c0c5B758a6BA100e3a049001de870f5;

    constructor() {}

    function asset() external view override returns (address) {
        return B70WETH30FEI;
    }

    function assets() external view override returns (address[] memory tokens) {
        tokens = new address[](3);
        tokens[0] = B70WETH30FEI;
        tokens[1] = FEI;
        tokens[2] = WETH;
    }

    // this contract does not custody any funds, it only converts tokens
    function balances(address owner) public view override returns (int256[] memory amounts) {
        amounts = new int256[](3);
        amounts[0] = 0;
        amounts[1] = 0;
        amounts[2] = 0;
    }

    // todo: inherit solmate ERC4626 mixin and override the needed functions
    // function function totalAssets() public view virtual returns (uint256);
    //  -> return 0
    // function beforeWithdraw(uint256 assets, uint256 shares) internal virtual {}
    //  -> do nothing
    // function afterDeposit(uint256 assets, uint256 shares) internal virtual {}
    //  -> do nothing

    function convertAssets(int256[] memory amountsIn, int256[] memory minAmountsOut)
        external
        override
        returns (int256[] memory amountsOut)
    {
        // Case 1 : want B70WETH30FEI out -> JoinPool
        if (minAmountsOut[0] != 0) {
            return _balancerJoinPool(amountsIn, minAmountsOut);
        }
        // Case 2 : want B70WETH30FEI in -> ExitPool
        else if (amountsIn[0] != 0) {
            // non-zero B70WETH30FEI
            return _balancerExitPool(amountsIn, minAmountsOut);
        }
        // Case 3 : want WETH or FEI out -> Swap
        else if (minAmountsOut[1] != 0 || minAmountsOut[2] != 0) {
            return _balancerSwap(amountsIn, minAmountsOut);
        }
    }

    function _balancerJoinPool(int256[] memory amountsIn, int256[] memory minAmountsOut)
        internal
        returns (int256[] memory amountsOut)
    {
        // TODO
    }

    function _balancerExitPool(int256[] memory amountsIn, int256[] memory minAmountsOut)
        internal
        returns (int256[] memory amountsOut)
    {
        // TODO
    }

    function _balancerSwap(int256[] memory amountsIn, int256[] memory minAmountsOut)
        internal
        returns (int256[] memory amountsOut)
    {
        // TODO
    }
}
