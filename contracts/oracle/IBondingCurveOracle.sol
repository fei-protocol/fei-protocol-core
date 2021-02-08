pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../bondingcurve/IBondingCurve.sol";
import "../external/Decimal.sol";

/// @title bonding curve oracle interface for Fei Protocol
/// @author Fei Protocol
interface IBondingCurveOracle is IOracle {
    // ----------- Genesis Group only state changing API -----------

    function init(Decimal.D256 calldata initialPrice) external;

    // ----------- Getters -----------

    function uniswapOracle() external returns (IOracle);

    function bondingCurve() external returns (IBondingCurve);

    function initialPrice() external returns (Decimal.D256 memory);
}
