pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./OracleRef.sol";
import "../external/Decimal.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniRef is OracleRef {
	using Decimal for Decimal.D256;
	using Babylonian for uint256;

	address internal constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
	IUniswapV2Router02 public router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
	IUniswapV2Pair public pair;

	constructor(address core) public OracleRef(core) {}

	modifier requirePair() {
		require(hasPair(), "UniRef: Contract has no pair defined");
		_;
	}

	function setPair(address _pair) public onlyGovernor {
		setupPair(_pair);
	}

	function setRouter(address _router) public onlyGovernor {
		router = IUniswapV2Router02(_router);
		uint256 maxInt =  uint256(-1);
		approveToken(address(fei()), maxInt);
		if (hasPair()) {
			approveToken(token(), maxInt);
		}
	}

	function liquidityOwned() public requirePair view returns (uint256) {
		return pair.balanceOf(address(this));
	}

	function token() public requirePair view returns (address) {
		address token0 = pair.token0();
		if (address(fei()) == token0) {
			return pair.token1();
		}
		return token0;
	}

	function ratioOwned() public view returns (Decimal.D256 memory) {	
    	uint256 balance = liquidityOwned();
    	uint256 total = pair.totalSupply();
    	return Decimal.ratio(balance, total);
    }

	function getReserves() public requirePair view returns (uint feiReserves, uint tokenReserves) {
        address token0 = pair.token0();
        (uint reserve0, uint reserve1,) = pair.getReserves();
        (feiReserves, tokenReserves) = address(fei()) == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
	}

    function isBelowPeg(Decimal.D256 memory peg) public requirePair view returns (bool) {
        (Decimal.D256 memory price,,) = getUniswapPrice();
        return peg.lessThan(price);
    }

    function approveToken(address _token, uint256 amount) internal {
    	IERC20(_token).approve(address(router), amount);
    }

    function setupPair(address _pair) internal {
    	pair = IUniswapV2Pair(_pair);
    }

    function hasPair() internal view returns (bool) {
    	return address(pair) != address(0);
    }

    function isPair(address account) public view returns(bool) {
        return address(pair) == account;
    }

    function getAmountToPeg(
        uint reserveTarget, 
        uint reserveOther, 
        Decimal.D256 memory peg
    ) internal view returns (uint) {
        uint radicand = peg.mul(reserveTarget).mul(reserveOther).asUint256();
        uint root = radicand.sqrt();
        if (root > reserveTarget) {
            return root - reserveTarget;
        }
        return reserveTarget - root;
    }

    function getAmountToPegFei() internal view returns (uint) {
        (uint feiReserves, uint tokenReserves) = getReserves();
        return getAmountToPeg(feiReserves, tokenReserves, peg());
    }

    function getAmountToPegOther() internal view returns (uint) {
        (uint feiReserves, uint tokenReserves) = getReserves();
        return getAmountToPeg(tokenReserves, feiReserves, invert(peg()));
    }

    function getUniswapPrice() internal view returns(
        Decimal.D256 memory, 
        uint reserveFei, 
        uint reserveOther
    ) {
        (reserveFei, reserveOther) = getReserves();
        return (Decimal.ratio(reserveFei, reserveOther), reserveFei, reserveOther);
    }

    function getFinalPrice(
    	int256 amountFei, 
    	uint256 reserveFei, 
    	uint256 reserveOther
    ) internal pure returns (Decimal.D256 memory) {
    	uint256 k = reserveFei * reserveOther;
    	uint256 adjustedReserveFei = uint256(int256(reserveFei) + amountFei);
    	uint256 adjustedReserveOther = k / adjustedReserveFei;
    	return Decimal.ratio(adjustedReserveFei, adjustedReserveOther); // alt: adjustedReserveFei^2 / k
    }

    function getPriceDeviations(int256 amountIn) internal view returns (
        Decimal.D256 memory initialDeviation, 
        Decimal.D256 memory finalDeviation
    ) {
        (Decimal.D256 memory price, uint reserveFei, uint reserveOther) = getUniswapPrice();
        initialDeviation = calculateDeviation(price, peg());
        Decimal.D256 memory finalPrice = getFinalPrice(amountIn, reserveFei, reserveOther);
        finalDeviation = calculateDeviation(finalPrice, peg());
        return (initialDeviation, finalDeviation);
    }

    function getDistanceToPeg() internal view returns(Decimal.D256 memory distance) {
        (Decimal.D256 memory price, , ) = getUniswapPrice();
        return calculateDeviation(price, peg()); 
    }

    function calculateDeviation(
        Decimal.D256 memory price, 
        Decimal.D256 memory peg
    ) internal view returns (Decimal.D256 memory) {
        // If price <= peg, then FEI is more expensive and above peg
        // In this case we can just return zero for deviation
        if (price.lessThanOrEqualTo(peg)) {
            return Decimal.zero();
        }
        Decimal.D256 memory delta = price.sub(peg, "UniswapIncentive: price exceeds peg"); // Should never error
        return delta.div(peg);
    }
}