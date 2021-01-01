pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/lib/contracts/libraries/Babylonian.sol";
import "./OracleRef.sol";
import "./IUniRef.sol";

/// @title UniRef abstract implementation contract
/// @author Fei Protocol
abstract contract UniRef is IUniRef, OracleRef {
	using Decimal for Decimal.D256;
	using Babylonian for uint;

	IUniswapV2Router02 public override router;
	IUniswapV2Pair public override pair;

	/// @notice UniRef constructor
	/// @param _core Fei Core to reference
    /// @param _pair Uniswap pair to reference
    /// @param _router Uniswap Router to reference
    /// @param _oracle oracle to reference
	constructor(address _core, address _pair, address _router, address _oracle) 
        public OracleRef(_core, _oracle) 
    {
        setupPair(_pair);

        router = IUniswapV2Router02(_router);

        approveToken(address(fei()));
        approveToken(token());
        approveToken(_pair);
    }

	function setPair(address _pair) external override onlyGovernor {
		setupPair(_pair);

        approveToken(token());
        approveToken(_pair);
	}

	function token() public override view returns (address) {
		address token0 = pair.token0();
		if (address(fei()) == token0) {
			return pair.token1();
		}
		return token0;
	}

	function getReserves() public override view returns (uint feiReserves, uint tokenReserves) {
        address token0 = pair.token0();
        (uint reserve0, uint reserve1,) = pair.getReserves();
        (feiReserves, tokenReserves) = address(fei()) == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        
        uint feiBalance = fei().balanceOf(address(pair));
        if(feiBalance > feiReserves) {
            feiReserves = feiBalance;
        }
        return (feiReserves, tokenReserves);
	}

	function liquidityOwned() public override view returns (uint) {
		return pair.balanceOf(address(this));
	}

    /// @notice ratio of all pair liquidity owned by this contract
	function ratioOwned() internal view returns (Decimal.D256 memory) {	
    	uint balance = liquidityOwned();
    	uint total = pair.totalSupply();
    	return Decimal.ratio(balance, total);
    }

    /// @notice returns true if price is below the peg
    /// @dev counterintuitively checks if peg < price because price is reported as FEI per X
    function isBelowPeg(Decimal.D256 memory peg) internal view returns (bool) {
        (Decimal.D256 memory price,,) = getUniswapPrice();
        return peg.lessThan(price);
    }

    /// @notice approves a token for the router
    function approveToken(address _token) internal {
    	IERC20(_token).approve(address(router), uint(-1));
    }

    function setupPair(address _pair) internal {
    	pair = IUniswapV2Pair(_pair);
        emit PairUpdate(_pair);
    }

    function isPair(address account) internal view returns(bool) {
        return address(pair) == account;
    }

    /// @notice utility for calculating absolute distance from peg based on reserves
    /// @param reserveTarget pair reserves of the asset desired to trade with
    /// @param reserveOther pair reserves of the non-traded asset
    /// @param peg the target peg reported as Target per Other 
    function getAmountToPeg(
        uint reserveTarget, 
        uint reserveOther, 
        Decimal.D256 memory peg
    ) internal pure returns (uint) {
        uint radicand = peg.mul(reserveTarget).mul(reserveOther).asUint256();
        uint root = radicand.sqrt();
        if (root > reserveTarget) {
            return root - reserveTarget;
        }
        return reserveTarget - root;
    }

    /// @notice calculate amount of Fei needed to trade back to the peg
    function getAmountToPegFei() internal view returns (uint) {
        (uint feiReserves, uint tokenReserves) = getReserves();
        return getAmountToPeg(feiReserves, tokenReserves, peg());
    }

    /// @notice calculate amount of the not Fei token needed to trade back to the peg
    function getAmountToPegOther() internal view returns (uint) {
        (uint feiReserves, uint tokenReserves) = getReserves();
        return getAmountToPeg(tokenReserves, feiReserves, invert(peg()));
    }

    /// @notice get uniswap price and reserves
    /// @return price reported as Fei per X
    /// @return reserveFei fei reserves
    /// @return reserveOther non-fei reserves
    function getUniswapPrice() internal view returns(
        Decimal.D256 memory, 
        uint reserveFei, 
        uint reserveOther
    ) {
        (reserveFei, reserveOther) = getReserves();
        return (Decimal.ratio(reserveFei, reserveOther), reserveFei, reserveOther);
    }

    /// @notice get final uniswap price after hypothetical FEI trade
    /// @param amountFei a signed integer representing FEI trade. Positive=sell, negative=buy
    /// @param reserveFei fei reserves
    /// @param reserveOther non-fei reserves
    function getFinalPrice(
    	int256 amountFei, 
    	uint reserveFei, 
    	uint reserveOther
    ) internal pure returns (Decimal.D256 memory) {
    	uint k = reserveFei * reserveOther;
    	uint adjustedReserveFei = uint(int256(reserveFei) + amountFei);
    	uint adjustedReserveOther = k / adjustedReserveFei;
    	return Decimal.ratio(adjustedReserveFei, adjustedReserveOther); // alt: adjustedReserveFei^2 / k
    }

    /// @notice return the percent distance from peg before and after a hypothetical trade
    /// @param amountIn a signed amount of FEI to be traded. Positive=sell, negative=buy 
    /// @return initialDeviation the percent distance from peg before trade
    /// @return finalDeviation the percent distance from peg after hypothetical trade
    /// @dev deviations will return Decimal.zero() if above peg
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

    /// @notice return current percent distance from peg
    /// @dev will return Decimal.zero() if above peg
    function getDistanceToPeg() internal view returns(Decimal.D256 memory distance) {
        (Decimal.D256 memory price, , ) = getUniswapPrice();
        return calculateDeviation(price, peg()); 
    }

    /// @notice get deviation from peg as a percent given price
    /// @dev will return Decimal.zero() if above peg
    function calculateDeviation(
        Decimal.D256 memory price, 
        Decimal.D256 memory peg
    ) internal pure returns (Decimal.D256 memory) {
        // If price <= peg, then FEI is more expensive and above peg
        // In this case we can just return zero for deviation
        if (price.lessThanOrEqualTo(peg)) {
            return Decimal.zero();
        }
        Decimal.D256 memory delta = price.sub(peg, "UniRef: price exceeds peg"); // Should never error
        return delta.div(peg);
    }
}