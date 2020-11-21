pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IAllocation.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "../core/CoreRef.sol";
import "../external/Decimal.sol";

abstract contract UniswapAllocation is IAllocation, CoreRef {
	using Decimal for Decimal.D256;

	address private TOKEN;
	address private PAIR;
	address private constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
	IUniswapV2Router02 private constant ROUTER = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

	constructor (address token, address core) 
	CoreRef(core)
	public {
		TOKEN = token;
		PAIR = UniswapV2Library.pairFor(UNISWAP_FACTORY, address(fii()), TOKEN);
	}

	function getAmountFiiToDeposit(uint256 amountToken) public view returns (uint amountFii) {
		(uint fiiReserves, uint tokenReserves) = getReserves();
		return UniswapV2Library.quote(amountToken, tokenReserves, fiiReserves);
	}

	function getReserves() public view returns (uint fiiReserves, uint tokenReserves) {
		return UniswapV2Library.getReserves(UNISWAP_FACTORY, address(fii()), TOKEN);
	}

	function totalValue() override public view returns(uint256) {
		(, uint256 tokenReserves) = getReserves();
    	return ratioOwned().mul(tokenReserves).asUint256();
    }

    function withdraw(uint256 amountUnderlying) override public onlyReclaimer {
    	uint256 totalUnderlying = totalValue();
    	require(amountUnderlying <= totalUnderlying, "Uniswap Allocation: Insufficient underlying");

    	uint256 totalLiquidity = liquidityOwned();
    	Decimal.D256 memory ratioToWithdraw = Decimal.ratio(amountUnderlying, totalUnderlying);
    	uint256 liquidityToWithdraw = ratioToWithdraw.mul(totalLiquidity).asUint256();

    	uint256 amountWithdrawn = removeLiquidity(liquidityToWithdraw, amountUnderlying); // TODO possibly need room for rounding errors here
    	transferWithdrawn(amountWithdrawn);
    	burnFiiHeld();
    }

    function burnFiiHeld() internal {
    	uint256 balance = fii().balanceOf(address(this));
    	fii().burn(balance);
    }

    function removeLiquidity(uint256 amount, uint256 amountETHMin) virtual internal returns(uint256);

    function transferWithdrawn(uint256 amount) virtual internal;

    function ratioOwned() public view returns (Decimal.D256 memory) {	
    	uint256 balance = liquidityOwned();
    	uint256 total = pair().totalSupply();
    	return Decimal.ratio(balance, total);
    }

	function mintFiiNeededToDeposit(uint256 amountToken) internal returns (uint amountFii) {
		amountFii = getAmountFiiToDeposit(amountToken);
		fii().mint(address(this), amountFii);
		return amountFii;
	}

	function liquidityOwned() public view returns (uint256) {
		return pair().balanceOf(address(this));
	}

	function pair() public view returns (IUniswapV2Pair) {
		return IUniswapV2Pair(PAIR);
	}

	function router() public pure returns (IUniswapV2Router02) {
		return ROUTER;
	}

	function token() public view returns (address) {
		return TOKEN;
	}

}