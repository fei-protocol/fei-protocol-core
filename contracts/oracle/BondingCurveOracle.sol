pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IBondingCurveOracle.sol";
import "../refs/CoreRef.sol";
import "../utils/Timed.sol";

/// @title Bonding curve oracle
/// @author Fei Protocol
/// @notice peg is to be the current bonding curve price if pre-Scale
/// @notice includes "thawing" on the initial purchase price at genesis. Time weights price from initial to true peg over a window.
contract BondingCurveOracle is IBondingCurveOracle, CoreRef, Timed {
    using Decimal for Decimal.D256;

    /// @notice the referenced uniswap oracle price
    IOracle public override uniswapOracle;

    /// @notice the referenced bonding curve
    IBondingCurve public override bondingCurve;

    Decimal.D256 internal _initialPrice;

    /// @notice BondingCurveOracle constructor
    /// @param _core Fei Core to reference
    /// @param _oracle Uniswap Oracle to report from
    /// @param _bondingCurve Bonding curve to report from
    /// @param _duration price thawing duration
    constructor(
        address _core,
        address _oracle,
        address _bondingCurve,
        uint256 _duration
    ) public CoreRef(_core) Timed(_duration) {
        uniswapOracle = IOracle(_oracle);
        bondingCurve = IBondingCurve(_bondingCurve);
        _pause();
    }

    /// @notice updates the oracle price
    /// @return true if oracle is updated and false if unchanged
    function update() external override returns (bool) {
        return uniswapOracle.update();
    }

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        return uniswapOracle.isOutdated();
    }

    /// @notice read the oracle price
    /// @return oracle price
    /// @return true if price is valid
    /// @dev price is to be denominated in USD per X where X can be ETH, etc.
    /// @dev Can be innacurate if outdated, need to call `isOutdated()` to check
    function read() external view override returns (Decimal.D256 memory, bool) {
        if (paused()) {
            return (Decimal.zero(), false);
        }
        (Decimal.D256 memory peg, bool valid) = _getOracleValue();
        return (_thaw(peg), valid);
    }

    /// @notice the initial price denominated in USD per FEI to thaw from
    function initialPrice() external view override returns (Decimal.D256 memory) {
        return _initialPrice;
    }

    /// @notice initializes the oracle with an initial peg price
    /// @param initPrice a price denominated in USD per FEI
    /// @dev divides the initial peg by the uniswap oracle price to get initialPrice. And kicks off thawing period
    function init(Decimal.D256 memory initPrice)
        public
        override
        onlyGenesisGroup
    {
        _unpause();
        
        if (initPrice.greaterThan(Decimal.one())) {
            initPrice = Decimal.one();
        }
        _initialPrice = initPrice;

        _initTimed();
    }

    function _thaw(Decimal.D256 memory peg)
        internal
        view
        returns (Decimal.D256 memory)
    {
        if (isTimeEnded()) {
            return peg;
        }
        uint256 elapsed = timeSinceStart();
        uint256 remaining = remainingTime();

        (Decimal.D256 memory uniswapPeg, ) = uniswapOracle.read();
        Decimal.D256 memory price = uniswapPeg.div(peg);

        // average price time weighted from initial to target
        Decimal.D256 memory weightedPrice =
            _initialPrice.mul(remaining).add(price.mul(elapsed)).div(duration);

        // divide from peg to return a peg FEI per X instead of a price USD per FEI
        return uniswapPeg.div(weightedPrice);
    }

    function _getOracleValue()
        internal
        view
        returns (Decimal.D256 memory, bool)
    {
        if (bondingCurve.atScale()) {
            return uniswapOracle.read();
        }
        return (bondingCurve.getCurrentPrice(), true);
    }
}
