pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/Initializable.sol";
import "./Permissions.sol";
import "./ICore.sol";
import "../token/Fei.sol";
import "../dao/Tribe.sol";

/// @title Source of truth for Fei Protocol
/// @author Fei Protocol
/// @notice maintains roles, access control, fei, tribe, genesisGroup, and the TRIBE treasury
contract Core is ICore, Permissions, Initializable {

    /// @notice the address of the FEI contract
    IFei public override fei;
    
    /// @notice the address of the TRIBE contract
    IERC20 public override tribe;

    /// @notice the address of the GenesisGroup contract
    address public override genesisGroup;
    /// @notice determines whether in genesis period or not
    bool public override hasGenesisGroupCompleted;

    function init() external override initializer {
        _setupGovernor(msg.sender);
        
        Fei _fei = new Fei(address(this));
        _setFei(address(_fei));

        Tribe _tribe = new Tribe(address(this), msg.sender);
        _setTribe(address(_tribe));
    }

    /// @notice sets Fei address to a new address
    /// @param token new fei address
    function setFei(address token) external override onlyGovernor {
        _setFei(token);
    }

    /// @notice sets Tribe address to a new address
    /// @param token new tribe address
    function setTribe(address token) external override onlyGovernor {
        _setTribe(token);
    }

    /// @notice sets Genesis Group address
    /// @param _genesisGroup new genesis group address
    function setGenesisGroup(address _genesisGroup)
        external
        override
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
        override
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

    /// @notice marks the end of the genesis period
    /// @dev can only be called once
    function completeGenesisGroup() external override {
        require(
            !hasGenesisGroupCompleted,
            "Core: Genesis Group already complete"
        );
        require(
            msg.sender == genesisGroup,
            "Core: Caller is not Genesis Group"
        );

        hasGenesisGroupCompleted = true;

        // solhint-disable-next-line not-rely-on-time
        emit GenesisPeriodComplete(block.timestamp);
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
