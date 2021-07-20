// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./../core/Permissions.sol";
import "../token/Fei.sol";
import "../dao/Tribe.sol";

/// @title Mock Source of truth for Fei Protocol
/// @author Fei Protocol
/// @notice maintains roles, access control, fei, tribe, genesisGroup, and the TRIBE treasury
contract MockCore is Permissions {

    event FeiUpdate(address indexed _fei);
    event TribeUpdate(address indexed _tribe);
    event GenesisGroupUpdate(address indexed _genesisGroup);
    event TribeAllocation(address indexed _to, uint256 _amount);
    event GenesisPeriodComplete(uint256 _timestamp);

    /// @notice the address of the FEI contract
    IFei public fei;
    
    /// @notice the address of the TRIBE contract
    IERC20 public tribe;

    /// @notice the address of the GenesisGroup contract
    address public genesisGroup;
    /// @notice determines whether in genesis period or not
    bool public hasGenesisGroupCompleted;

    constructor() {
        uint256 id;
        assembly {
            id := chainid()
        }
        require(id != 1, "cannot deploy mock on mainnet");

        _setupGovernor(msg.sender);
        
        Fei _fei = new Fei(address(this));
        _setFei(address(_fei));

        Tribe _tribe = new Tribe(address(this), msg.sender);
        _setTribe(address(_tribe));
    }

    /// @notice sets Fei address to a new address
    /// @param token new fei address
    function setFei(address token) external onlyGovernor {
        _setFei(token);
    }

    /// @notice sets Tribe address to a new address
    /// @param token new tribe address
    function setTribe(address token) external onlyGovernor {
        _setTribe(token);
    }

    /// @notice Mints fei to the specified address
    /// @param to new tribe address
    /// @param amount new tribe address
    function mintFEI(address to, uint256 amount) external onlyGovernor {
        fei.mint(to, amount);
    }

    /// @notice sets Genesis Group address
    /// @param _genesisGroup new genesis group address
    function setGenesisGroup(address _genesisGroup)
        external
        onlyGovernor
    {
        genesisGroup = _genesisGroup;
        emit GenesisGroupUpdate(_genesisGroup);
    }

    /// @notice sends TRIBE tokens from treasury to an address
    /// @param to the address to send TRIBE to
    /// @param amount the amount of TRIBE to send
    function allocateTribe(address to, uint256 amount)
        external
        onlyGovernor
    {
        IERC20 _tribe = tribe;
        require(
            _tribe.balanceOf(address(this)) >= amount,
            "Core: Not enough Tribe"
        );

        _tribe.transfer(to, amount);

        emit TribeAllocation(to, amount);
    }

    function _setFei(address token) internal {
        fei = IFei(token);
        emit FeiUpdate(token);
    }

    function _setTribe(address token) internal {
        tribe = IERC20(token);
        emit TribeUpdate(token);
    }
}
