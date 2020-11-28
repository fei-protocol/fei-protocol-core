pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IAllocation.sol";
import "../core/CoreRef.sol";
import "../external/Decimal.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract UniswapAllocation is IAllocation, CoreRef {
	using Decimal for Decimal.D256;

	address private TOKEN;
	address private PAIR;
	address private constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
	IUniswapV2Router02 private ROUTER = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

	constructor (address token, address core) 
		CoreRef(core)
	public {
		uint256 maxInt =  uint256(-1);
		approveToken(address(fii()), maxInt);
		TOKEN = token;
		approveToken(token, maxInt);
		PAIR = UniswapV2Library.pairFor(UNISWAP_FACTORY, address(fii()), TOKEN);
	}

	function withdraw(address to, uint256 amountUnderlying) public override onlyReclaimer {
    	uint256 totalUnderlying = totalValue();
    	require(amountUnderlying <= totalUnderlying, "Uniswap Allocation: Insufficient underlying");

    	uint256 totalLiquidity = liquidityOwned();
    	Decimal.D256 memory ratioToWithdraw = Decimal.ratio(amountUnderlying, totalUnderlying);
    	uint256 liquidityToWithdraw = ratioToWithdraw.mul(totalLiquidity).asUint256();

    	approveToken(address(pair()), liquidityToWithdraw);
    	uint256 amountWithdrawn = removeLiquidity(liquidityToWithdraw, amountUnderlying); // TODO possibly need room for rounding errors here
    	transferWithdrawn(to, amountWithdrawn);
    	burnFiiHeld();
    }

	function setPair(address _pair) public onlyGovernor {
		PAIR = _pair;
	}

	function setToken(address _token) public onlyGovernor {
		TOKEN = _token;
		uint256 maxInt =  uint256(-1);
		approveToken(_token, maxInt);
	}

	function setRouter(address _router) public onlyGovernor {
		ROUTER = IUniswapV2Router02(_router);
		uint256 maxInt =  uint256(-1);
		approveToken(address(fii()), maxInt);
		approveToken(TOKEN, maxInt);
	}

	function totalValue() public view override returns(uint256) {
		(, uint256 tokenReserves) = getReserves();
    	return ratioOwned().mul(tokenReserves).asUint256();
    }

	function getAmountFiiToDeposit(uint256 amountToken) public view returns (uint amountFii) {
		(uint fiiReserves, uint tokenReserves) = getReserves();
		return UniswapV2Library.quote(amountToken, tokenReserves, fiiReserves);
	}

	function getReserves() public view returns (uint fiiReserves, uint tokenReserves) {
		address token0 = pair().token0();
        (uint reserve0, uint reserve1,) = pair().getReserves();
        (fiiReserves, tokenReserves) = address(fii()) == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
	}

    function ratioOwned() public view returns (Decimal.D256 memory) {	
    	uint256 balance = liquidityOwned();
    	uint256 total = pair().totalSupply();
    	return Decimal.ratio(balance, total);
    }

	function liquidityOwned() public view returns (uint256) {
		return pair().balanceOf(address(this));
	}

	function pair() public view returns (IUniswapV2Pair) {
		return IUniswapV2Pair(PAIR);
	}

	function token() public view returns (address) {
		return TOKEN;
	}

	function router() public view returns (IUniswapV2Router02) {
		return ROUTER;
	}

    function removeLiquidity(uint256 amount, uint256 amountETHMin) internal virtual returns(uint256);

    function transferWithdrawn(address to, uint256 amount) internal virtual;

    function burnFiiHeld() internal {
    	uint256 balance = fii().balanceOf(address(this));
    	fii().burn(balance);
    }

    function approveToken(address _token, uint256 amount) internal {
    	IERC20(_token).approve(address(router()), amount);
    }

	function mintFii(uint256 amount) internal {
		fii().mint(address(this), amount);
	}

}