pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./IOracle.sol";

/// @title Uniswap oracle interface
/// @author Fei Protocol
interface IUniswapOracle is IOracle {
    // ----------- Events -----------
    event DurationUpdate(uint256 _duration);

    // ----------- Governor only state changing API -----------

    function setDuration(uint256 _duration) external;

    // ----------- Getters -----------

    function priorTimestamp() external returns (uint32);

    function priorCumulative() external returns (uint256);

    function duration() external returns (uint256);

    function pair() external returns (IUniswapV2Pair);
}
