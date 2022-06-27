// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IPCVDeposit.sol";
import "../../refs/CoreRef.sol";

/// @title a contract to skim excess FEI from addresses
/// @author Fei Protocol
contract FeiSkimmer is CoreRef {
    event ThresholdUpdate(uint256 newThreshold);
    event SourceUpdate(address newSource);

    /// @notice source PCV deposit to skim excess FEI from
    IPCVDeposit public source;

    /// @notice the threshold of FEI above which to skim
    uint256 public threshold;

    /// @notice FEI Skimmer
    /// @param _core Fei Core for reference
    /// @param _source the target to skim from
    /// @param _threshold the threshold of FEI to be maintained by source
    constructor(
        address _core,
        IPCVDeposit _source,
        uint256 _threshold
    ) CoreRef(_core) {
        source = _source;
        threshold = _threshold;
        _setContractAdminRole(keccak256("PCV_MINOR_PARAM_ROLE"));
        emit ThresholdUpdate(threshold);
    }

    /// @return true if FEI balance of source exceeds threshold
    function skimEligible() external view returns (bool) {
        return fei().balanceOf(address(source)) > threshold;
    }

    /// @notice skim FEI above the threshold from the source. Pausable. Requires skimEligible()
    function skim() external whenNotPaused {
        IFei _fei = fei();
        uint256 feiTotal = _fei.balanceOf(address(source));

        require(feiTotal > threshold, "under threshold");

        uint256 burnAmount = feiTotal - threshold;
        source.withdrawERC20(address(_fei), address(this), burnAmount);

        _fei.burn(burnAmount);
    }

    /// @notice set the threshold for FEI skims. Only Governor or Admin
    /// @param newThreshold the new value above which FEI is skimmed.
    function setThreshold(uint256 newThreshold) external onlyGovernorOrAdmin {
        threshold = newThreshold;
        emit ThresholdUpdate(newThreshold);
    }

    /// @notice Set the target to skim from. Only Governor
    /// @param newSource the new source to skim from
    function setSource(address newSource) external onlyGovernor {
        source = IPCVDeposit(newSource);
        emit SourceUpdate(newSource);
    }
}
