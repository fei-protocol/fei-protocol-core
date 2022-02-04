// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../fei/IFei.sol";
import "./TribeRoles.sol";
import "../external/solmate/src/auth/Auth.sol";
import "../external/solmate/src/auth/authorities/MultiRolesAuthority.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract TribeAuth is TribeRoles, Auth, Pausable {

    IFei public immutable fei;

    IERC20 public immutable tribe;

    constructor(Authority _authority, IFei _fei, IERC20 _tribe) 
        Auth(address(0), _authority)
    {
        require(address(_authority) != address(0), "no authority");
        fei = _fei;
        tribe = _tribe;
    }

    modifier onlyPCVController() {
        require(_callerHasRole(PCV_CONTROLLER) || isAuthorized(msg.sender, msg.sig), "UNAUTHORIZED: PCV Controller");
        _;
    }

    modifier onlyRole(uint8 role) {
        require(_callerHasRole(role) || isAuthorized(msg.sender, msg.sig), "UNAUTHORIZED");
        _;
    }

    modifier onlyGovernor() {
        require(_callerHasRole(GOVERNOR) || isAuthorized(msg.sender, msg.sig), "UNAUTHORIZED: Governor");

        _;
    }

    modifier onlyGuardian() {
        require(_callerHasRole(GUARDIAN) || isAuthorized(msg.sender, msg.sig), "UNAUTHORIZED: Guardian");
        _;
    }

    /// @notice set pausable methods to paused
    function pause() public onlyGuardian {
        _pause();
    }

    /// @notice set pausable methods to unpaused
    function unpause() public onlyGuardian {
        _unpause();
    }

    function _callerHasRole(uint8 role) private view returns (bool) {
        return MultiRolesAuthority(address(authority)).doesUserHaveRole(msg.sender, role);
    }
}