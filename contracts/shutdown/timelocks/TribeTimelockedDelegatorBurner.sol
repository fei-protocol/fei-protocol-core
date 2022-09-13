// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Tribe} from "../../tribe/Tribe.sol";
import {TimelockedDelegator} from "../../timelocks/TimelockedDelegator.sol";

/// @notice TribeTimelockedDelegatorBurner which can acceptBeneficiary(), permissionlessly send
///         vested tokens to the Core Treasury and also permissionlessly undelegate()
contract TribeTimelockedDelegatorBurner {
    /// @notice Tribe Timelocked Delegator token timelock
    TimelockedDelegator public immutable timelock;

    /// @notice Core Treasury
    address public constant core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;

    /// @notice TRIBE ERC20 token
    Tribe private constant TRIBE = Tribe(0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B);

    /// @param _tribeTimelock Tribe Timelocked delegator contract which is being burned
    constructor(TimelockedDelegator _tribeTimelock) {
        timelock = _tribeTimelock;
    }

    /// @notice Permissionless undelegate method for undelegating before releaseMax() is called
    function undelegate(address _delegate) external {
        timelock.undelegate(_delegate);
    }

    /// @notice Accept the beneficiary of the target timelock
    function acceptBeneficiary() external {
        timelock.acceptBeneficiary();
    }

    /// @notice Permissionless method to send all TRIBE held on this contract to the Core Treasury
    function sendTribeToTreaury() external {
        // Release all currently vested TRIBE to this contract
        timelock.releaseMax(address(this));

        // Send released TRIBE to core
        uint256 tribeBalance = TRIBE.balanceOf(address(this));
        if (tribeBalance != 0) {
            TRIBE.transfer(core, tribeBalance);
        }
    }
}
