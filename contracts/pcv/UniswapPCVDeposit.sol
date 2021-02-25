pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "./IPCVDeposit.sol";
import "../external/Decimal.sol";
import "../refs/UniRef.sol";

/// @title abstract implementation for Uniswap LP PCV Deposit
/// @author Fei Protocol
abstract contract UniswapPCVDeposit is IPCVDeposit, UniRef {
    using Decimal for Decimal.D256;

    /// @notice Uniswap PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pair Uniswap Pair to deposit to
    /// @param _router Uniswap Router
    /// @param _oracle oracle for reference
    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle
    ) public UniRef(_core, _pair, _router, _oracle) {}

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
        whenNotPaused
    {
        uint256 totalUnderlying = totalValue();
        require(
            amountUnderlying <= totalUnderlying,
            "UniswapPCVDeposit: Insufficient underlying"
        );

        uint256 totalLiquidity = liquidityOwned();

        // ratio of LP tokens needed to get out the desired amount
        Decimal.D256 memory ratioToWithdraw =
            Decimal.ratio(amountUnderlying, totalUnderlying);
        
        // amount of LP tokens factoring in ratio
        uint256 liquidityToWithdraw =
            ratioToWithdraw.mul(totalLiquidity).asUint256();

        uint256 amountWithdrawn = _removeLiquidity(liquidityToWithdraw);

        _transferWithdrawn(to, amountWithdrawn);

        _burnFeiHeld();

        emit Withdrawal(msg.sender, to, amountWithdrawn);
    }

    /// @notice returns total value of PCV in the Deposit
    function totalValue() public view override returns (uint256) {
        (, uint256 tokenReserves) = getReserves();
        return _ratioOwned().mul(tokenReserves).asUint256();
    }

    function _getAmountFeiToDeposit(uint256 amountToken)
        internal
        view
        returns (uint256 amountFei)
    {
        return peg().mul(amountToken).asUint256();
    }

    function _removeLiquidity(uint256 amount)
        internal
        virtual
        returns (uint256);

    function _transferWithdrawn(address to, uint256 amount) internal virtual;
}
