// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "../refs/IUniRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract LiquidityTransferHelper is CoreRef {
    using SafeERC20 for IERC20;

    address constant public FEI_TRIBE_LP = address(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);
    address constant public UNI_ROUTER_02 = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    address immutable public feiNewTimelock;
    address immutable public tribeNewTimelock;

    constructor(
        address _core,
        address _feiNewTimelock,
        address _tribeNewTimelock
    ) CoreRef(_core) {
        feiNewTimelock = _feiNewTimelock;
        tribeNewTimelock = _tribeNewTimelock;
    }

    /// @notice This is the function that does everything:
    /// - first it asserts that it has a reasonable balance of fei/tribe lp
    /// - next it pulls liquidity from uniswap
    /// - then it transfer the fei and tribe to the new timelock
    /// - finally it does some sanity checks and asserts to make sure everything is good
    function doLiquidityTransfer() public {
        // Assert that we have a nonzero amount of FEI/TRIBE lp
        require(IERC20(FEI_TRIBE_LP).balanceOf(address(this)) > 0, "No FEI-TRIBE LP");

        // Pull liquidity from uniswap
        IUniswapV2Router01_2(UNI_ROUTER_02).removeLiquidity(
            address(fei()), 
            address(tribe()), 
            IERC20(FEI_TRIBE_LP).balanceOf(address(this)), 
            0, 
            0, 
            address(this),
            block.timestamp
        );

        // Ensure that we have a reasonable amount of FEI & Tribe
        require(IERC20(fei()).balanceOf(address(this)) > 50_000_000 ether, "Not enough FEI");
        require(IERC20(tribe()).balanceOf(address(this)) > 50_000_000 ether, "Not enough Tribe");

        // Transfer FEI & Tribe to the new timelock
        IERC20(address(fei())).safeTransfer(feiNewTimelock, fei().balanceOf(address(this)));
        IERC20(address(tribe())).safeTransfer(tribeNewTimelock, tribe().balanceOf(address(this)));

        // Ensure that the new timelock has the correct amount of FEI & Tribe
        require(IERC20(fei()).balanceOf(feiNewTimelock) > 50_000_000 ether, "Timelock did not have enough FEI!");
        require(IERC20(tribe()).balanceOf(tribeNewTimelock) > 50_000_000 ether, "Timelock did not have enough Tribe!");
    }
}