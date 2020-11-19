pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IOracle {
    function setup() external;
    function capture() external returns (Decimal.D256 memory, bool);
    // function pair() external view returns (address);
}