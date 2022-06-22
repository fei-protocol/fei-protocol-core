// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title PauseableLib
/// @notice PauseableLib is a library that can be used to pause and unpause contracts, amont other utilities.
/// @dev This library should only be used on contracts that implement CoreRef.
library CoreRefPauseableLib {
    function _requireUnpaused(address _pausableCoreRefAddress) internal view {
        require(
            !CoreRef(_pausableCoreRefAddress).paused(),
            "PausableLib: Address is paused but required to not be paused."
        );
    }

    function _requirePaused(address _pausableCoreRefAddress) internal view {
        require(
            CoreRef(_pausableCoreRefAddress).paused(),
            "PausableLib: Address is not paused but required to be paused."
        );
    }

    function _ensureUnpaused(address _pausableCoreRefAddress) internal {
        if (CoreRef(_pausableCoreRefAddress).paused()) {
            CoreRef(_pausableCoreRefAddress).unpause();
        }
    }

    function _ensurePaused(address _pausableCoreRefAddress) internal {
        if (!CoreRef(_pausableCoreRefAddress).paused()) {
            CoreRef(_pausableCoreRefAddress).pause();
        }
    }

    function _pause(address _pauseableCoreRefAddress) internal {
        CoreRef(_pauseableCoreRefAddress).pause();
    }

    function _unpause(address _pauseableCoreRefAddress) internal {
        CoreRef(_pauseableCoreRefAddress).unpause();
    }
}
