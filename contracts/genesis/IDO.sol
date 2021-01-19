pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "./IDOInterface.sol";
import "../utils/LinearTokenTimelock.sol";
import "../refs/UniRef.sol";

/// @title IDOInterface implementation
/// @author Fei Protocol
contract IDO is IDOInterface, UniRef, LinearTokenTimelock {

	/// @notice IDO constructor
	/// @param _core Fei Core address to reference
	/// @param _beneficiary the beneficiary to vest LP shares
	/// @param _duration the duration of LP share vesting
	/// @param _pair the Uniswap pair contract of the IDO
	/// @param _router the Uniswap router contract
	constructor(
		address _core, 
		address _beneficiary, 
		uint32 _duration, 
		address _pair, 
		address _router
	) public
		UniRef(_core, _pair, _router, address(0)) // no oracle needed
		LinearTokenTimelock(_beneficiary, _duration)
	{
		setLockedToken(_pair);
	}

	function deploy(Decimal.D256 calldata feiRatio) external override onlyGenesisGroup {
		uint tribeAmount = tribeBalance();

		uint feiAmount = feiRatio.mul(tribeAmount).asUint256();
		_mintFei(feiAmount);

		router.addLiquidity(
	        address(tribe()),
	        address(fei()),
	        tribeAmount,
	        feiAmount,
	        tribeAmount,
	        feiAmount,
	        address(this),
	        uint(-1)
	    );

	    emit Deploy(feiAmount, tribeAmount);
	} 

	function swapFei(uint amountFei) external override onlyGenesisGroup returns(uint) {

		(uint feiReserves, uint tribeReserves) = getReserves();

		uint amountOut = UniswapV2Library.getAmountOut(amountFei, feiReserves, tribeReserves);

		fei().transferFrom(msg.sender, address(pair), amountFei);

		(uint amount0Out, uint amount1Out) = pair.token0() == address(fei()) ? (uint(0), amountOut) : (amountOut, uint(0));
		pair.swap(amount0Out, amount1Out, msg.sender, new bytes(0));

		return amountOut;
	}
}