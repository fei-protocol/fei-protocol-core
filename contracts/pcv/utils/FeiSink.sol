// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IPCVDeposit.sol"; 
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title a contract to skim excess FEI from addresses
/// @author Fei Protocol
contract FeiSink is CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;
 
    event ThresholdUpdate(address source, uint256 newThreshold);   
    event SourceAdded(address newSource, uint256 threshold);
    event SourceRemoved(address source);

    /// @notice source PCV deposit to skim excess FEI from
    EnumerableSet.AddressSet private sources;

    /// @notice the threshold of FEI above which to skim
    mapping(address => uint256) public thresholds;

    /// @notice FEI Skimmer
    /// @param _core Fei Core for reference
    /// @param _sources the targets to skim from
    /// @param _thresholds the thresholds of FEI to be maintained by sources
    constructor(
        address _core,
        address[] memory _sources,
        uint256[] memory _thresholds
    ) 
        CoreRef(_core)
    {
        require(_sources.length == _thresholds.length, "array length mismatch");
        require(_sources.length > 0, "must provide at least once source");
        
        for(uint i=0; i<_sources.length; i++) {
            sources.add(_sources[i]);
            thresholds[_sources[i]] = _thresholds[i];
            emit SourceAdded(_sources[i], _thresholds[i]);
        }
    }

    /// @notice convenience method to view sources & thresholds
    function getSources() external view returns (address[] memory sourceAddresses, uint256[] memory sourceThresholds) {
        sourceAddresses = new address[](sources.length());
        sourceThresholds = new uint256[](sources.length());

        for (uint i=0; i<sources.length(); i++) {
            sourceAddresses[i] = sources.at(i);
            sourceThresholds[i] = thresholds[sources.at(i)];
        }

        return (sourceAddresses, sourceThresholds);
    }

    /// @notice convenience method to view source addresses
    function getSourceAddresses() public view returns(address[] memory sourceAddresses) {
        sourceAddresses = new address[](sources.length());

        for (uint i=0; i<sources.length(); i++) {
            sourceAddresses[i] = sources.at(i);
        }

        return sourceAddresses;
    }

    /// @return true if FEI balance of source exceeds threshold
    function skimEligible(address _source) public view returns (bool) {
        return (sources.contains(_source) && (getBurnAmount(_source) > 0));
    }

    /// @notice skim FEI above the threshold from the source. Pausable. Requires skimEligible()
    function skim(address[] calldata _sources)
        public
        whenNotPaused
    {
        for (uint i=0; i< _sources.length; i++) {
            require(sources.contains(i), "invalid skim source");
            _skim(_sources[i]);
        }

        _burnFeiHeld();
    }

    /// @notice skim FEI above the threshold for all sources. Pausable. Requires skimEligible()
    function skimAll()
        external
        whenNotPaused
    {
        skim(getSourceAddresses());
    }

    /// @notice set the threshold for FEI skims. Only Governor or Admin
    /// @param newThreshold the new value above which FEI is skimmed.
    function setThreshold(address source, uint256 newThreshold) external onlyGovernorOrAdmin {
        require(sources.contains(source), "source not valid");
        thresholds[source] = newThreshold;
        emit ThresholdUpdate(source, newThreshold);
    }

    /// @notice set the source for FEI skims. Only Governor
    /// @param newSource the new source from which FEI is skimmed.
    function addSource(address newSource, uint256 threshold) external onlyGovernor {
        sources.add(newSource);
        thresholds[newSource] = threshold;
        emit SourceAdded(newSource, threshold);
    }

    /// @notice remove a source for FEI skims. Only Governor or Guardian
    /// @param sourceToRemove the source to remove from skimming.
    /// @dev we don't need to set thresholds for source to zero as it doesnt matter
    function removeSource(address sourceToRemove) external onlyGuardianOrGovernor {
        sources.remove(sourceToRemove);
        emit SourceRemoved(sourceToRemove);
    }

    function _skim(address _source) internal {
        uint256 skimAmount = _getSkimAmount(_source);

        if (skimAmount > 0) {
            IPCVDeposit(_source).withdrawERC20(address(fei), address(this), skimAmount);
        }
    }

    function _getSkimAmount(address _source) internal view returns (uint256) {
        uint256 sourceBalance = IPCVDeposit(_source).balance();
        return sourceBalance > thresholds[_source] ? sourceBalance - thresholds[_source] : 0;
    }
}