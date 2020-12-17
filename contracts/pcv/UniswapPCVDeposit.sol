pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPCVDeposit.sol";
import "../refs/UniRef.sol";
import "../external/Decimal.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

abstract contract UniswapPCVDeposit is IPCVDeposit, UniRef {
	using Decimal for Decimal.D256;

	constructor (address token, address core) public
		UniRef(core)
	{
		uint256 maxInt =  uint256(-1);
		approveToken(address(fei()), maxInt);
		approveToken(token, maxInt);
		address _pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, address(fei()), token);
		setupPair(_pair);
	}

	function withdraw(address to, uint256 amountUnderlying) external override onlyPCVController {
    	uint256 totalUnderlying = totalValue();
    	require(amountUnderlying <= totalUnderlying, "UniswapPCVDeposit: Insufficient underlying");

    	uint256 totalLiquidity = liquidityOwned();
    	Decimal.D256 memory ratioToWithdraw = Decimal.ratio(amountUnderlying, totalUnderlying);
    	uint256 liquidityToWithdraw = ratioToWithdraw.mul(totalLiquidity).asUint256();

    	// TODO possibly move to constructor
    	approveToken(address(pair), liquidityToWithdraw);
    	uint256 amountWithdrawn = removeLiquidity(liquidityToWithdraw);
    	transferWithdrawn(to, amountWithdrawn);
    	burnFeiHeld();
    }

	function totalValue() public view override returns(uint256) {
		(, uint256 tokenReserves) = getReserves();
    	return ratioOwned().mul(tokenReserves).asUint256();
    }

	function getAmountFeiToDeposit(uint256 amountToken) public view returns (uint amountFei) {
		(uint feiReserves, uint tokenReserves) = getReserves();
		if (feiReserves == 0 || tokenReserves == 0) {
			return peg().mul(amountToken).asUint256();
		}
		return UniswapV2Library.quote(amountToken, tokenReserves, feiReserves);
	}

    function removeLiquidity(uint256 amount) internal virtual returns(uint256);

    function transferWithdrawn(address to, uint256 amount) internal virtual;

}