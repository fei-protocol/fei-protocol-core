pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IDOInterface.sol";
import "../refs/UniRef.sol";
import "../token/LinearTokenTimelock.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

/// @title IDOInterface implementation
/// @author Fei Protocol
contract IDO is UniRef, LinearTokenTimelock, IDOInterface {

	event Deploy(uint _amountFei, uint _amountTribe);

	constructor(address core, address _beneficiary, uint32 _duration, address _pair, address _router) public
		UniRef(core, _pair, _router, address(0))
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
}