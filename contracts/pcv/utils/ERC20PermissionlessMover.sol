// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../refs/CoreRef.sol";
import "../../Constants.sol";
import "../IPCVDeposit.sol";
import "../../refs/ICoreRef.sol";

/// @title contract for moving ERC20s from one PCVDeposit to another whitelisted
/// address. This contract needs to be granted PCV_CONTROLLER role.
/// @author Fei Protocol
contract ERC20PermissionlessMover is CoreRef {

    /// @notice Mapping of whitelisted movements
    /// @dev map order is whitelist[tokenAddress][fromAddress] = toAddress
    mapping(address => mapping (address => address)) whitelist;

    event WhitelistAdd(address indexed token, address indexed from, address indexed to);
    event WhitelistRemove(address indexed token, address indexed from, address indexed to);
    event Move(address indexed token, address indexed from, address indexed to, uint256 amount);

    /// @notice ERC20PermissionlessMover constructor
    /// @param _core reference to the protocol Core
    constructor(address _core) CoreRef(_core) {}

    /// @notice Whitelist a token transfer from one PCVDeposit to another
    /// @param _token to transfer
    /// @param _from source of the token
    /// @param _to destination of the token
    function addToWhitelist(address _token, address _from, address _to) public onlyGovernorOrAdmin {
        require(_to != address(0), "ERC20PermissionlessMover: _to zero address");
        require(_token != address(0), "ERC20PermissionlessMover: _token zero address");

        whitelist[_token][_from] = _to;

        emit WhitelistAdd(_token, _from, _to);
    }

    /// @notice Whitelist a token transfer from one PCVDeposit to another
    /// @param _token to transfer
    /// @param _from source of the token
    function removeFromWhitelist(address _token, address _from) public onlyGovernorOrAdmin {
        require(whitelist[_token][_from] != address(0), "ERC20PermissionlessMover: not added to whitelist");

        address _oldTo = whitelist[_token][_from];
        whitelist[_token][_from] = address(0);

        emit WhitelistRemove(_token, _from, _oldTo);
    }

    /// @notice Move a token from a deposit to a whitelisted destination
    /// @param _token to transfer
    /// @param _from source of the token
    function move(address _token, address _from) public whenNotPaused {
        address _to = whitelist[_token][_from];
        require(_to != address(0), "ERC20PermissionlessMover: no whitelisted destination");

        uint256 _amount = IERC20(_token).balanceOf(_from);
        IPCVDeposit(_from).withdrawERC20(_token, _to, _amount);

        emit Move(_token, _from, _to, _amount);
    }
}
