pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../token/IFei.sol";

/// @title Access control module for Core
/// @author Fei Protocol
interface IPermissions {
    // Governor only state changing api

    /// @notice creates a new role to be maintained
    /// @param role the new role id
    /// @param adminRole the admin role id for `role`
    /// @dev can also be used to update admin of existing role
	function createRole(bytes32 role, bytes32 adminRole) external;

    /// @notice grants minter role to address
    /// @param minter new minter
	function grantMinter(address minter) external;

    /// @notice grants burner role to address
    /// @param burner new burner
	function grantBurner(address burner) external;

    /// @notice grants controller role to address
    /// @param pcvController new controller
	function grantPCVController(address pcvController) external;

    /// @notice grants governor role to address
    /// @param governor new governor
	function grantGovernor(address governor) external;

    /// @notice grants revoker role to address
    /// @param revoker new revoker
	function grantRevoker(address revoker) external;

    /// @notice revokes minter role from address
    /// @param minter ex minter
    function revokeMinter(address minter) external;

    /// @notice revokes burner role from address
    /// @param burner ex burner
    function revokeBurner(address burner) external;

    /// @notice revokes pcvController role from address
    /// @param pcvController ex pcvController
    function revokePCVController(address pcvController) external;

    /// @notice revokes governor role from address
    /// @param governor ex governor
    function revokeGovernor(address governor) external;

    /// @notice revokes revoker role from address
    /// @param revoker ex revoker
    function revokeRevoker(address revoker) external;

    // Revoker only state changing api

    /// @notice revokes a role from address
    /// @param role the role to revoke
    /// @param account the address to revoke the role from
    function revokeOverride(bytes32 role, address account) external;

    // Getters

    /// @notice checks if address is a burner
    /// @param _address address to check
    /// @return true _address is a burner
	function isBurner(address _address) external view returns (bool);

    /// @notice checks if address is a minter
    /// @param _address address to check
    /// @return true _address is a minter
	function isMinter(address _address) external view returns (bool);

    /// @notice checks if address is a governor
    /// @param _address address to check
    /// @return true _address is a governor
	function isGovernor(address _address) external view returns (bool);

    /// @notice checks if address is a revoker
    /// @param _address address to check
    /// @return true _address is a revoker
    function isRevoker(address _address) external view returns (bool);

    /// @notice checks if address is a controller
    /// @param _address address to check
    /// @return true _address is a controller
	function isPCVController(address _address) external view returns (bool);
}
