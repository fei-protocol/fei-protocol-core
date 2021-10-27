pragma solidity ^0.8.4;

interface IPriceBoundPSM {

    // ----------- Events -----------

    /// @notice event emitted when minimum floor price is updated
    event OracleFloorUpdate(uint256 oldFloor, uint256 newFloor);
    /// @notice event emitted when maximum ceiling price is updated
    event OracleCeilingUpdate(uint256 oldCeiling, uint256 newCeiling);


    // ----------- Governor or admin only state changing api -----------

    /// @notice sets the floor price in BP
    function setOracleFloor(uint256 newFloor) external;
    /// @notice sets the ceiling price in BP
    function setOracleCeiling(uint256 newCeiling) external;
}
