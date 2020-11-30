pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPCVDeposit.sol";
import "../refs/UniRef.sol";
import "../external/Decimal.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

abstract contract UniswapPCVDeposit is IPCVDeposit, UniRef {
	using Decimal for Decimal.D256;

	constructor (address token, address core) 
		UniRef(core)
	public {
		uint256 maxInt =  uint256(-1);
		approveToken(address(fei()), maxInt);
		approveToken(token, maxInt);
		address _pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, address(fei()), token);
		setupPair(_pair);
	}

	function withdraw(address to, uint256 amountUnderlying) public override onlyReclaimer {
    	uint256 totalUnderlying = totalValue();
    	require(amountUnderlying <= totalUnderlying, "UniswapPCVDeposit: Insufficient underlying");

    	uint256 totalLiquidity = liquidityOwned();
    	Decimal.D256 memory ratioToWithdraw = Decimal.ratio(amountUnderlying, totalUnderlying);
    	uint256 liquidityToWithdraw = ratioToWithdraw.mul(totalLiquidity).asUint256();

    	approveToken(address(pair), liquidityToWithdraw);
    	uint256 amountWithdrawn = removeLiquidity(liquidityToWithdraw, amountUnderlying); // TODO possibly need room for rounding errors here
    	transferWithdrawn(to, amountWithdrawn);
    	burnFeiHeld();
    }

	function totalValue() public view override returns(uint256) {
		(, uint256 tokenReserves) = getReserves();
    	return ratioOwned().mul(tokenReserves).asUint256();
    }

	function getAmountFeiToDeposit(uint256 amountToken) public view returns (uint amountFei) {
		(uint feiReserves, uint tokenReserves) = getReserves();
		return UniswapV2Library.quote(amountToken, tokenReserves, feiReserves);
	}

    function removeLiquidity(uint256 amount, uint256 amountETHMin) internal virtual returns(uint256);

    function transferWithdrawn(address to, uint256 amount) internal virtual;

	function mintFei(uint256 amount) internal {
		fei().mint(address(this), amount);
	}
}