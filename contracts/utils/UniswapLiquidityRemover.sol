// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Constants} from "../Constants.sol";

/// @title Uniswap pool liquidity remover
/// @notice Redeems Uniswap FEI-TRIBE LP tokens held on this contract for the underlying FEI and TRIBE.
///         Then burns the remaining redeemed FEI and transfers the redeemed TRIBE to Core treasury
///         Expected that this contract holds all LP tokens prior to redemption
contract UniswapLiquidityRemover is CoreRef {
    using SafeERC20 for IERC20;

    event RemoveLiquidity(uint256 amountFei, uint256 amountTribe);
    event WithdrawERC20(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);

    /// @notice Uniswap V2 version 2 Router
    IUniswapV2Router02 public constant UNISWAP_ROUTER = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /// @notice Uniswap Fei-Tribe LP token
    IUniswapV2Pair public constant FEI_TRIBE_PAIR = IUniswapV2Pair(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);

    /// @param _core FEI protocol Core address
    constructor(address _core) CoreRef(_core) {}

    ///////////   Public state changing API   ///////////////

    /// @notice Redeem LP tokens held on this contract for underlying FEI and TRIBE.
    ///         Burn all the FEI redeemed and send all TRIBE to Core
    /// @param minAmountFeiOut Minimum amount of FEI to be redeemed
    /// @param minAmountTribeOut Minimum amount of TRIBE to be redeemed
    /// @return feiLiquidity Redeemed FEI liquidity that is burned
    /// @return tribeLiquidity Redeemed TRIBE liquidity that is sent to Core
    function redeemLiquidity(uint256 minAmountFeiOut, uint256 minAmountTribeOut)
        external
        onlyTribeRole(TribeRoles.GOVERNOR)
        returns (uint256, uint256)
    {
        uint256 amountLP = FEI_TRIBE_PAIR.balanceOf(address(this));
        require(amountLP > 0, "LiquidityRemover: Insufficient liquidity");

        // Approve Uniswap router to swap tokens
        FEI_TRIBE_PAIR.approve(address(UNISWAP_ROUTER), amountLP);

        // Remove liquidity from Uniswap and send underlying to this contract
        UNISWAP_ROUTER.removeLiquidity(
            address(fei()),
            address(tribe()),
            amountLP,
            minAmountFeiOut,
            minAmountTribeOut,
            address(this),
            block.timestamp
        );

        uint256 feiLiquidity = fei().balanceOf(address(this));
        uint256 tribeLiquidity = tribe().balanceOf(address(this));

        // Burn all FEI
        fei().burn(feiLiquidity);

        // Send all remaining TRIBE to Core
        tribe().safeTransfer(address(core()), tribeLiquidity);

        emit RemoveLiquidity(feiLiquidity, tribeLiquidity);
        return (feiLiquidity, tribeLiquidity);
    }

    /// @notice Emergency withdraw function to withdraw funds from the contract
    /// @param token ERC20 token being withdrawn
    /// @param to Address to send tokens to
    /// @param amount Amount of tokens to be withdrawn
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyTribeRole(TribeRoles.PCV_CONTROLLER) {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }
}
