pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SignedSafeMath.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";
import "./OracleRef.sol";
import "./IUniRef.sol";
import "../external/SafeMathCopy.sol";

/// @title A Reference to Uniswap
/// @author Fei Protocol
/// @notice defines some modifiers and utilities around interacting with Uniswap
/// @dev the uniswap pair should be FEI and another asset
abstract contract UniRef is IUniRef, OracleRef {
    using Decimal for Decimal.D256;
    using Babylonian for uint256;
    using SignedSafeMath for int256;
    using SafeMathCopy for uint256;
    using SafeCast for uint256;
    using SafeCast for int256;

    /// @notice the Uniswap router contract
    IUniswapV2Router02 public override router;

    /// @notice the referenced Uniswap pair contract
    IUniswapV2Pair public override pair;

    /// @notice UniRef constructor
    /// @param _core Fei Core to reference
    /// @param _pair Uniswap pair to reference
    /// @param _router Uniswap Router to reference
    /// @param _oracle oracle to reference
    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle
    ) public OracleRef(_core, _oracle) {
        _setupPair(_pair);

        router = IUniswapV2Router02(_router);

        _approveToken(address(fei()));
        _approveToken(token());
        _approveToken(_pair);
    }

    /// @notice set the new pair contract
    /// @param _pair the new pair
    /// @dev also approves the router for the new pair token and underlying token
    function setPair(address _pair) external override onlyGovernor {
        _setupPair(_pair);

        _approveToken(token());
        _approveToken(_pair);
    }

    /// @notice the address of the non-fei underlying token
    function token() public view override returns (address) {
        address token0 = pair.token0();
        if (address(fei()) == token0) {
            return pair.token1();
        }
        return token0;
    }

    /// @notice pair reserves with fei listed first
    /// @dev uses the max of pair fei balance and fei reserves. Mitigates attack vectors which manipulate the pair balance
    function getReserves()
        public
        view
        override
        returns (uint256 feiReserves, uint256 tokenReserves)
    {
        address token0 = pair.token0();
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        (feiReserves, tokenReserves) = address(fei()) == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        return (feiReserves, tokenReserves);
    }

    /// @notice amount of pair liquidity owned by this contract
    /// @return amount of LP tokens
    function liquidityOwned() public view override returns (uint256) {
        return pair.balanceOf(address(this));
    }

    /// @notice ratio of all pair liquidity owned by this contract
    function _ratioOwned() internal view returns (Decimal.D256 memory) {
        uint256 balance = liquidityOwned();
        uint256 total = pair.totalSupply();
        return Decimal.ratio(balance, total);
    }

    /// @notice returns true if price is below the peg
    /// @dev counterintuitively checks if peg < price because price is reported as FEI per X
    function _isBelowPeg(Decimal.D256 memory peg) internal view returns (bool) {
        (Decimal.D256 memory price, , ) = _getUniswapPrice();
        return peg.lessThan(price);
    }

    /// @notice approves a token for the router
    function _approveToken(address _token) internal {
        uint256 maxTokens = uint256(-1);
        IERC20(_token).approve(address(router), maxTokens);
    }

    function _setupPair(address _pair) internal {
        pair = IUniswapV2Pair(_pair);
        emit PairUpdate(_pair);
    }

    function _isPair(address account) internal view returns (bool) {
        return address(pair) == account;
    }

    /// @notice utility for calculating absolute distance from peg based on reserves
    /// @param reserveTarget pair reserves of the asset desired to trade with
    /// @param reserveOther pair reserves of the non-traded asset
    /// @param peg the target peg reported as Target per Other
    function _getAmountToPeg(
        uint256 reserveTarget,
        uint256 reserveOther,
        Decimal.D256 memory peg
    ) internal pure returns (uint256) {
        uint256 radicand = peg.mul(reserveTarget).mul(reserveOther).asUint256();
        uint256 root = radicand.sqrt();
        if (root > reserveTarget) {
            return (root - reserveTarget).mul(1000).div(997);
        }
        return (reserveTarget - root).mul(1000).div(997);
    }

    /// @notice calculate amount of Fei needed to trade back to the peg
    function _getAmountToPegFei(
        uint256 feiReserves,
        uint256 tokenReserves,
        Decimal.D256 memory peg
    ) internal pure returns (uint256) {
        return _getAmountToPeg(feiReserves, tokenReserves, peg);
    }

    /// @notice calculate amount of the not Fei token needed to trade back to the peg
    function _getAmountToPegOther(
        uint256 feiReserves,
        uint256 tokenReserves,
        Decimal.D256 memory peg
    ) internal pure returns (uint256) {
        return _getAmountToPeg(tokenReserves, feiReserves, invert(peg));
    }

    /// @notice get uniswap price and reserves
    /// @return price reported as Fei per X
    /// @return reserveFei fei reserves
    /// @return reserveOther non-fei reserves
    function _getUniswapPrice()
        internal
        view
        returns (
            Decimal.D256 memory,
            uint256 reserveFei,
            uint256 reserveOther
        )
    {
        (reserveFei, reserveOther) = getReserves();
        return (
            Decimal.ratio(reserveFei, reserveOther),
            reserveFei,
            reserveOther
        );
    }

    /// @notice get final uniswap price after hypothetical FEI trade
    /// @param amountFei a signed integer representing FEI trade. Positive=sell, negative=buy
    /// @param reserveFei fei reserves
    /// @param reserveOther non-fei reserves
    function _getFinalPrice(
        int256 amountFei,
        uint256 reserveFei,
        uint256 reserveOther
    ) internal pure returns (Decimal.D256 memory) {
        uint256 k = reserveFei.mul(reserveOther);
        int256 signedReservesFei = reserveFei.toInt256();
        int256 amountFeiWithFee = amountFei.mul(997).div(1000);

        uint256 adjustedReserveFei = signedReservesFei.add(amountFeiWithFee).toUint256();
        uint256 adjustedReserveOther = k / adjustedReserveFei;
        return Decimal.ratio(adjustedReserveFei, adjustedReserveOther); // alt: adjustedReserveFei^2 / k
    }

    /// @notice return the percent distance from peg before and after a hypothetical trade
    /// @param amountIn a signed amount of FEI to be traded. Positive=sell, negative=buy
    /// @return initialDeviation the percent distance from peg before trade
    /// @return finalDeviation the percent distance from peg after hypothetical trade
    /// @dev deviations will return Decimal.zero() if above peg
    function _getPriceDeviations(int256 amountIn)
        internal
        view
        returns (
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation,
            Decimal.D256 memory _peg,
            uint256 feiReserves,
            uint256 tokenReserves
        )
    {
        _peg = peg();

        (Decimal.D256 memory price, uint256 reserveFei, uint256 reserveOther) =
            _getUniswapPrice();
        initialDeviation = _deviationBelowPeg(price, _peg);

        Decimal.D256 memory finalPrice =
            _getFinalPrice(amountIn, reserveFei, reserveOther);
        finalDeviation = _deviationBelowPeg(finalPrice, _peg);

        return (
            initialDeviation,
            finalDeviation,
            _peg,
            reserveFei,
            reserveOther
        );
    }

    /// @notice return current percent distance from peg
    /// @dev will return Decimal.zero() if above peg
    function _getDistanceToPeg()
        internal
        view
        returns (Decimal.D256 memory distance)
    {
        (Decimal.D256 memory price, , ) = _getUniswapPrice();
        return _deviationBelowPeg(price, peg());
    }

    /// @notice get deviation from peg as a percent given price
    /// @dev will return Decimal.zero() if above peg
    function _deviationBelowPeg(
        Decimal.D256 memory price,
        Decimal.D256 memory peg
    ) internal pure returns (Decimal.D256 memory) {
        // If price <= peg, then FEI is more expensive and above peg
        // In this case we can just return zero for deviation
        if (price.lessThanOrEqualTo(peg)) {
            return Decimal.zero();
        }
        Decimal.D256 memory delta = price.sub(peg, "Impossible underflow");
        return delta.div(peg);
    }
}
