pragma solidity ^0.8.0;

import "../pcv/utils/PCVSplitter.sol";

/// @title TribeSplitter
/// @notice a contract to split TRIBE held to multiple locations
contract TribeSplitter is PCVSplitter {
    /**
        @notice constructor for TribeSplitter
        @param _core the Core address to reference
        @param _tribeDeposits the locations to send TRIBE
        @param _ratios the relative ratios of how much TRIBE to send each location, in basis points
    */
    constructor(
        address _core,
        address[] memory _tribeDeposits,
        uint256[] memory _ratios
    ) 
        CoreRef(_core)
        PCVSplitter(_tribeDeposits, _ratios)
    {}

    /// @notice distribute held TRIBE
    function allocate() external whenNotPaused {
        _allocate(tribeBalance());
    }

    function _allocateSingle(uint256 amount, address pcvDeposit) internal override {
        tribe().transfer(pcvDeposit, amount);        
    }
}