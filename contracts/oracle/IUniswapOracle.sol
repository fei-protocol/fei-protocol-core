pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./IOracle.sol";

/// @title Uniswap oracle interface for Fei Protocol
/// @author Fei Protocol
/// @notice maintains the TWAP of a uniswap pair contract over a specified duration
interface IUniswapOracle is IOracle {

	// ----------- Events -----------
    event DurationUpdate(uint32 _duration);

    // ----------- Governor only state changing API -----------

    /// @notice set a new duration for the TWAP window
    function setDuration(uint32 _duration) external;

    // ----------- Getters -----------

    /// @notice the previous timestamp of the oracle snapshot
    function priorTimestamp() external returns(uint32);

    /// @notice the previous cumulative price of the oracle snapshot
    function priorCumulative() external returns(uint);

    /// @notice the window over which the initial price will "thaw" to the true peg price
    function duration() external returns(uint32);

    /// @notice the referenced uniswap pair contract
    function pair() external returns(IUniswapV2Pair);
}