// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Timelock} from "../../dao/timelock/FeiDAOTimelock.sol";

/// @title DAO timelock burner
/// @notice Accepts the admin of the Fei and Rari DAO timelocks, in order to burn them and prevent the admin being transferred
contract DAOTimelockBurner {
    /// @notice Fei DAO timelock
    Timelock public constant FEI_DAO_TIMELOCK = Timelock(payable(0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c));

    /// @notice Rari DAO timelock
    Timelock public constant RARI_DAO_TIMELOCK = Timelock(payable(0x8ace03Fc45139fDDba944c6A4082b604041d19FC));

    /// @notice Accept the admin of the Fei DAO timelock
    function acceptFeiDAOTimelockAdmin() external {
        FEI_DAO_TIMELOCK.acceptAdmin();
    }

    /// @notice Accept the admin of the timelock
    function acceptRariDAOTimelockAdmin() external {
        RARI_DAO_TIMELOCK.acceptAdmin();
    }
}
