pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../bondingcurve/IBondingCurve.sol";
import "../external/Decimal.sol";

/// @title bonding curve oracle interface for Fei Protocol
/// @author Fei Protocol
/// @notice peg is to be the current bonding curve price if pre-Scale
interface IBondingCurveOracle is IOracle {
    // ----------- Genesis Group only state changing API -----------

    /// @notice initializes the oracle with an initial peg price
    /// @param initialPrice a price denominated in USD per FEI
    /// @dev divides the initial peg by the uniswap oracle price to get initialPrice. And kicks off thawing period
    function init(Decimal.D256 calldata initialPrice) external;

    // ----------- Getters -----------

    /// @notice the referenced uniswap oracle price
    function uniswapOracle() external returns (IOracle);

    /// @notice the referenced bonding curve
    function bondingCurve() external returns (IBondingCurve);

    /// @notice the initial price denominated in USD per FEI to thaw from
    function initialPrice() external returns (Decimal.D256 memory);
}
