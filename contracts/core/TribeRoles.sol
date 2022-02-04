// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/**
 @title Tribe DAO ACL Roles
 @notice Holds a complete list of all roles which can be held by contracts inside Tribe DAO.
         Roles are broken up into 3 categories:
         * Major Roles [1...9] - the most powerful roles in the Tribe DAO which should be carefully managed.
         * Admin Roles [10...99] - roles with management capability over critical functionality. Should only be held by automated or optimistic mechanisms
         * Minor Roles [99...255] - operational roles. May be held or managed by shorter optimistic timelocks or trusted multisigs.
 */
contract TribeRoles {

    /*///////////////////////////////////////////////////////////////
                                 Major Roles
    //////////////////////////////////////////////////////////////*/
    
    /// @notice the ultimate role of Tribe. Controls all other roles and protocol functionality.
    uint8 public constant GOVERNOR = 1;
    
    /// @notice the protector role of Tribe. Admin of pause, veto, revoke, and minor roles
    uint8 public constant GUARDIAN = 2;
    
    /// @notice the role which can arbitrarily move PCV in any size from any contract
    uint8 public constant PCV_CONTROLLER = 3;

    /// @notice can mint FEI arbitrarily
    // TODO: do we need this?
    uint8 public constant MINTER = 4;
    
    /*///////////////////////////////////////////////////////////////
                                 Admin Roles
    //////////////////////////////////////////////////////////////*/

    /// @notice can manage the majority of Tribe protocol parameters. Sets boundaries for MINOR_PARAM_ROLE.
    uint8 public constant PARAMETER_ADMIN = 10;
    
    /// @notice manages the Collateralization Oracle as well as other protocol oracles.
    uint8 public constant ORACLE_ADMIN = 11;
    
    /// @notice manages TribalChief incentives and related functionality.
    uint8 public constant TRIBAL_CHIEF_ADMIN = 12;

    /// @notice manages PCVGuardian and admin of PCV_TOKEN_MOVER.
    uint8 public constant PCV_GUARDIAN_ADMIN = 13;

    /// @notice admin of all Minor Roles
    uint8 public constant MINOR_ROLE_ADMIN = 14;

    /// @notice admin of the Fuse protocol
    uint8 public constant FUSE_ADMIN = 15;

    /// @notice capable of vetoing DAO votes or optimistic timelocks
    uint8 public constant VETO_ADMIN = 16;
    
    /// @notice capable of revoking any role from any contract except Governor or Guardian
    uint8 public constant REVOKE_ADMIN = 17;
    
    /// @notice capable of pausing any contract
    uint8 public constant PAUSE_ADMIN = 18;

    /// @notice capable of setting FEI Minters within global rate limits and caps
    uint8 public constant MINTER_ADMIN = 19;

    /// @notice manages the constituents of Optimistic Timelocks, including Proposers and Executors
    uint8 public constant OPTIMISTIC_ADMIN = 20;

    /*///////////////////////////////////////////////////////////////
                                 Minor Roles
    //////////////////////////////////////////////////////////////*/

    /// @notice capable of poking existing LBP auctions to exchange tokens.
    uint8 public constant LBP_SWAP_ROLE = 100;
    
    /// @notice capable of engaging with Votium for voting incentives.
    uint8 public constant VOTIUM_ROLE = 101;

    /// @notice capable of moving PCV between like-kind whitelisted deposits
    uint8 public constant PCV_TOKEN_MOVER_ROLE = 102;

    /// @notice capable of changing parameters within non-critical ranges
    uint8 public constant MINOR_PARAM_ROLE = 103;
}