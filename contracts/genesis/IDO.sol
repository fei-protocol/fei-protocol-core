pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../refs/UniRef.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "../token/LinearTokenTimelock.sol";

contract IDO is UniRef, LinearTokenTimelock {

	event Deploy(uint _amountFei, uint _amountTribe);

	constructor(address core, address _beneficiary, uint _duration) public
		UniRef(core)
		LinearTokenTimelock(_beneficiary, _duration)
	{
		uint256 maxInt =  uint256(-1);
		address _tribe = address(tribe()); 
		address _fei = address(fei());
		approveToken(_fei, maxInt);
		approveToken(_tribe, maxInt);
		address _pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, _fei, _tribe);
		setupPair(_pair);
		setLockedToken(_pair);
	}

	function deploy(Decimal.D256 calldata feiRatio) external onlyGenesisGroup {
		uint tribeAmount = tribeBalance();
		uint feiAmount = feiRatio.mul(tribeAmount).asUint256();
		mintFei(feiAmount);
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