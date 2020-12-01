pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IOracle {
    function update() external returns (bool);
    function read() external view returns (Decimal.D256 memory, bool);
}