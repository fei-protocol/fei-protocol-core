pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

/// @title generic oracle interface for Fei Protocol
/// @author Fei Protocol
interface IOracle {
	
    // ----------- Events -----------

	event KillSwitchUpdate(bool _killSwitch);

	event Update(uint _peg);

    // ----------- State changing API -----------

    /// @notice updates the oracle price
    /// @return true if oracle is updated and false if unchanged
    function update() external returns (bool);

    // ----------- Governor only state changing API -----------

    /// @notice sets the kill switch on the oracle feed
    /// @param _killSwitch the new value for the kill switch
    function setKillSwitch(bool _killSwitch) external;

    // ----------- Getters -----------

    /// @notice read the oracle price
    /// @return oracle price
    /// @return true if price is valid
    /// @dev price is to be denominated in USD per X where X can be ETH, etc.
    function read() external view returns (Decimal.D256 memory, bool);

    /// @notice the kill switch for the oracle feed
    /// @return true if kill switch engaged
    /// @dev if kill switch is true, read will return invalid
    function killSwitch() external view returns (bool);
}