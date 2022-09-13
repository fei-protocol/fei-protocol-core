// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Fei} from "../../fei/Fei.sol";
import {LinearTokenTimelock} from "../../timelocks/LinearTokenTimelock.sol";

/// @notice Accept the beneficiary of a Fei token timelock. Permissionlessly burn any Fei available for release
contract FeiLinearTokenTimelockBurner {
    /// @notice Fei token timelock
    LinearTokenTimelock public immutable timelock;

    /// @notice Fei ERC20 token
    Fei private constant FEI = Fei(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);

    constructor(address _feiTokenTimelock) {
        timelock = LinearTokenTimelock(_feiTokenTimelock);
    }

    /// @notice Accept the beneficiary of the target timelock
    function acceptBeneficiary() external {
        timelock.acceptBeneficiary();
    }

    /// @notice Burn all FEI held by the Fei token timelock
    function burnFeiHeld() external {
        timelock.releaseMax(address(this));
        uint256 feiBalance = FEI.balanceOf(address(this));

        if (feiBalance != 0) {
            FEI.burn(feiBalance);
        }
    }
}
