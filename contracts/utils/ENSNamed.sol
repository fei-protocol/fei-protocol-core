// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IENSReverseRegistrar {
    function setName(string memory name) external returns (bytes32);
}

/// @title abstract contract used to set ENS name
/// @author eswak
abstract contract ENSNamed {
    address public constant ENS_REVERSE_REGISTRAR = 0x084b1c3C81545d370f3634392De611CaaBFf8148;
    string public ensName = "";

    event ENSNameUpdated(string oldName, string newName);

    /// @notice set ENS name in the reverse registrar
    /// @dev this function is not access controlled, used override with an
    /// appropriate modifier to add access control.
    function setName(string calldata newName) public virtual {
        _setName(newName);
    }

    /// @notice set ENS name in the reverse registrar
    function _setName(string calldata newName) internal {
        emit ENSNameUpdated(ensName, newName);
        IENSReverseRegistrar(ENS_REVERSE_REGISTRAR).setName(newName);
        ensName = newName;
    }
}
