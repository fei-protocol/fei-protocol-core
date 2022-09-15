// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title contract used to redeem a list of tokens, by permanently
/// taking another token out of circulation.
/// @author Fei Protocol
contract TribeRedeemer is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice event to track redemptions
    event Redeemed(address indexed owner, address indexed receiver, uint256 amount, uint256 base);

    /// @notice token to redeem
    address public immutable redeemedToken;

    /// @notice tokens to receive when redeeming
    address[] private tokensReceived;

    /// @notice base used to compute the redemption amounts.
    /// For instance, if the base is 100, and a user provides 100 `redeemedToken`,
    /// they will receive all the balances of each `tokensReceived` held on this contract.
    uint256 public redeemBase;

    constructor(
        address _redeemedToken,
        address[] memory _tokensReceived,
        uint256 _redeemBase
    ) {
        redeemedToken = _redeemedToken;
        tokensReceived = _tokensReceived;
        redeemBase = _redeemBase;
    }

    /// @notice Public function to get `tokensReceived`
    function tokensReceivedOnRedeem() public view returns (address[] memory) {
        return tokensReceived;
    }

    /// @notice Return the balances of `tokensReceived` that would be
    /// transferred if redeeming `amountIn` of `redeemedToken`.
    function previewRedeem(uint256 amountIn)
        public
        view
        returns (address[] memory tokens, uint256[] memory amountsOut)
    {
        tokens = tokensReceivedOnRedeem();
        amountsOut = new uint256[](tokens.length);

        uint256 base = redeemBase;
        for (uint256 i = 0; i < tokensReceived.length; i++) {
            uint256 balance = IERC20(tokensReceived[i]).balanceOf(address(this));
            require(balance != 0, "ZERO_BALANCE");
            // @dev, this assumes all of `tokensReceived` and `redeemedToken`
            // have the same number of decimals
            uint256 redeemedAmount = (amountIn * balance) / base;
            amountsOut[i] = redeemedAmount;
        }
    }

    /// @notice Redeem `redeemedToken` for a pro-rata basket of `tokensReceived`
    function redeem(address to, uint256 amountIn) external nonReentrant {
        IERC20(redeemedToken).safeTransferFrom(msg.sender, address(this), amountIn);

        (address[] memory tokens, uint256[] memory amountsOut) = previewRedeem(amountIn);

        uint256 base = redeemBase;
        redeemBase = base - amountIn; // decrement the base for future redemptions
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).safeTransfer(to, amountsOut[i]);
        }

        emit Redeemed(msg.sender, to, amountIn, base);
    }
}
