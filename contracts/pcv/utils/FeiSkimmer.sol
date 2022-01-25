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

    /// @return true if FEI balance of source exceeds threshold
    function skimEligible(address _source) public view returns (bool) {
        require(sources.contains(_source), "source not valid");
        return fei().balanceOf(_source) > thresholds[_source];
    }

    /// @notice skim FEI above the threshold from the source. Pausable. Requires skimEligible()
    function skim(address _source)
        public
        whenNotPaused
    {
        if(skimEligible(_source)) {
            IFei fei = fei();
            uint256 burnAmount = fei.balanceOf(_source) - thresholds[_source];
            IPCVDeposit(_source).withdrawERC20(address(fei), address(this), burnAmount);
            fei.burn(burnAmount);
        }
    }

    /// @notice skim FEI above the threshold for all sources. Pausable. Requires skimEligible()
    function skimAll()
        external
        whenNotPaused
    {
        for(uint i=0; i<sources.length(); i++) {
            skim(sources.at(i));
        }
    }

    /// @notice set the threshold for FEI skims. Only Governor or Admin
    /// @param newThreshold the new value above which FEI is skimmed.
    function setThreshold(address source, uint256 newThreshold) external onlyGovernorOrAdmin {
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
}