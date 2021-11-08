// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

library PauseableLib {
    function _requireUnpaused(address _pausableCoreRefAddress) public view {
        require(!CoreRef(_pausableCoreRefAddress).paused(), "PausableLib: Address is paused but required to not be paused.");
    }

    function _requirePaused(address _pausableCoreRefAddress) public view {
        require(CoreRef(_pausableCoreRefAddress).paused(), "PausableLib: Address is not paused but required to be paused.");
    }

    function _ensureUnpaused(address _pausableCoreRefAddress) public {
        if (CoreRef(_pausableCoreRefAddress).paused()) {
            CoreRef(_pausableCoreRefAddress).unpause();
        }
    }

    function _ensurePaused(address _pausableCoreRefAddress) public {
        if (!CoreRef(_pausableCoreRefAddress).paused()) {
            CoreRef(_pausableCoreRefAddress).pause();
        }
    }

    function _pause(address _pauseableCoreRefAddress) public {
        CoreRef(_pauseableCoreRefAddress).pause();
    }
    
    function _unpause(address _pauseableCoreRefAddress) public {
        CoreRef(_pauseableCoreRefAddress).unpause();
    }
}