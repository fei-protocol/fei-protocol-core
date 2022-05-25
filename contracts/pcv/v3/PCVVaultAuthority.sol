// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../../external/solmate/Auth.sol";
import "../../refs/CoreRef.sol";
import "../../core/TribeRoles.sol";

/// @title abstract contract for withdrawing ERC-20 tokens using a PCV Controller
/// @author eswak
contract PCVVaultAuthority is Authority, CoreRef {
    constructor(address core) CoreRef(core) {}

    /// @notice returns true if a user has a proper role to call a given function.
    function canCall(
        address user,
        address, /*target*/
        bytes4 functionSig
    ) external view returns (bool) {
        // memoize core to save gas
        ICore core = core();

        // setGnosisSafeAddress(address)
        if (functionSig == 0x36c56ab2) return core.hasRole(TribeRoles.GOVERNOR, user);
        // TODO: the above is just an example, add all requiresAuth functions of the PCVVault here
        // and discuss what roles would be appropriate with the rest of the dev team

        // default (everything else is onlyOwner)
        return false;
    }
}
