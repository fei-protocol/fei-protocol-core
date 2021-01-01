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

	function withdraw(address to, uint amountUnderlying) external override onlyPCVController {
    	uint totalUnderlying = totalValue();
    	require(amountUnderlying <= totalUnderlying, "UniswapPCVDeposit: Insufficient underlying");

    	uint totalLiquidity = liquidityOwned();
    	Decimal.D256 memory ratioToWithdraw = Decimal.ratio(amountUnderlying, totalUnderlying);
    	uint liquidityToWithdraw = ratioToWithdraw.mul(totalLiquidity).asUint256();

    	uint amountWithdrawn = _removeLiquidity(liquidityToWithdraw);
		
    	_transferWithdrawn(to, amountWithdrawn);
		
    	_burnFeiHeld();

    	emit Withdrawal(msg.sender, to, amountWithdrawn);
    }

	function totalValue() public view override returns(uint) {
		(, uint tokenReserves) = getReserves();
    	return ratioOwned().mul(tokenReserves).asUint256();
    }

	function _getAmountFeiToDeposit(uint amountToken) internal view returns (uint amountFei) {
		(uint feiReserves, uint tokenReserves) = getReserves();
		if (feiReserves == 0 || tokenReserves == 0) {
			return peg().mul(amountToken).asUint256();
		}
		return UniswapV2Library.quote(amountToken, tokenReserves, feiReserves);
	}

    function _removeLiquidity(uint amount) internal virtual returns(uint);

    function _transferWithdrawn(address to, uint amount) internal virtual;

}