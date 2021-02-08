pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

/// @title generic oracle interface for Fei Protocol
/// @author Fei Protocol
interface IOracle {
    // ----------- Events -----------

    event KillSwitchUpdate(bool _killSwitch);

    event Update(uint256 _peg);

    // ----------- State changing API -----------

    function update() external returns (bool);

    // ----------- Governor only state changing API -----------

    function setKillSwitch(bool _killSwitch) external;

    // ----------- Getters -----------

    function read() external view returns (Decimal.D256 memory, bool);

    function isOutdated() external view returns (bool);

    function killSwitch() external view returns (bool);
}
