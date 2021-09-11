// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./../core/Permissions.sol";
import "../token/Fei.sol";
import "../dao/Tribe.sol";

/// @title Mock Source of truth for Fei Protocol
/// @author Fei Protocol
/// @notice maintains roles, access control, fei, tribe, genesisGroup, and the TRIBE treasury
contract MockCore is Permissions {

    /// @notice the address of the FEI contract
    IFei public fei;
    
    /// @notice the address of the TRIBE contract
    IFei public tribe;

    /// @notice tracks whether the contract has been initialized
    bool private _initialized;

    constructor() {
        require(!_initialized, "initialized");
        _initialized = true;

        uint256 id;
        assembly {
            id := chainid()
        }
        require(id != 1, "cannot deploy mock on mainnet");
        _setupGovernor(msg.sender);
        
        Fei _fei = new Fei(address(this));
        fei = IFei(_fei);

        Tribe _tribe = new Tribe(msg.sender, msg.sender);
        tribe = IFei(address(_tribe));
    }
}
