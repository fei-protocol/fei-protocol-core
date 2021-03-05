pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../bondingcurve/IBondingCurve.sol";
import "../external/Decimal.sol";

/// @title bonding curve oracle interface for Fei Protocol
/// @author Fei Protocol
interface IBondingCurveOracle is IOracle {
    // ----------- Genesis Group only state changing API -----------

    function init(Decimal.D256 calldata initialUSDPrice) external;

    // ----------- Getters -----------

    function uniswapOracle() external view returns (IOracle);

    function bondingCurve() external view returns (IBondingCurve);

    function initialUSDPrice() external view returns (Decimal.D256 memory);
}
