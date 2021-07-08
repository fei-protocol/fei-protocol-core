// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IPCVDeposit.sol";
import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface CToken {
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function exchangeRateStored() external view returns (uint);
    function balanceOf(address account) external view returns (uint);
}

/// @title abstract implementation for a Compound PCV Deposit
/// @author Fei Protocol
abstract contract CompoundPCVDeposit is IPCVDeposit, CoreRef {

    CToken public cToken;

    uint256 private constant EXCHANGE_RATE_SCALE = 1e18;

    /// @notice Compound PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _cToken Compound cToken to deposit
    constructor(
        address _core,
        address _cToken
    ) CoreRef(_core) {
        cToken = CToken(_cToken);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
        whenNotPaused
    {
        require(
            cToken.redeemUnderlying(amountUnderlying) == 0,
            "CompoundPCVDeposit: redeem error"
        );
        _transferUnderlying(to, amountUnderlying);
        emit Withdrawal(msg.sender, to, amountUnderlying);
    }

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external override onlyPCVController {
        SafeERC20.safeTransfer(IERC20(token), to, amount);
        emit WithdrawERC20(msg.sender, address(token), to, amount);
    }

    /// @notice returns total balance of PCV in the Deposit excluding the FEI
    /// @dev returns stale values from Compound if the market hasn't been updated
    function balance() public view override returns (uint256) {
        uint256 exchangeRate = cToken.exchangeRateStored();
        return cToken.balanceOf(address(this)) * exchangeRate / EXCHANGE_RATE_SCALE;
    }

    function _transferUnderlying(address to, uint256 amount) internal virtual;
}
