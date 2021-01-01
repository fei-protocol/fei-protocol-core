pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IPermissions.sol";
import "../token/IFei.sol";

/// @title Source of truth for Fei Protocol
/// @author Fei Protocol
/// @notice maintains roles, access control, fei, tribe, genesisGroup, and the TRIBE treasury
interface ICore is IPermissions {

	// ----------- Events -----------

    event FeiUpdate(address indexed _fei);
    event TribeAllocation(address indexed _to, uint _amount);
    event GenesisPeriodComplete(uint _timestamp);

    // ----------- Governor only state changing api -----------

    /// @notice sets Fei address to a new address
    /// @param token new fei address
    function setFei(address token) external;

    /// @notice sets Genesis Group address
    /// @param _genesisGroup new genesis group address
    function setGenesisGroup(address _genesisGroup) external;

    /// @notice sends TRIBE tokens from treasury to an address
    /// @param to the address to send TRIBE to
    /// @param amount the amount of TRIBE to send
    function allocateTribe(address to, uint amount) external;

    // ----------- Genesis Group only state changing api -----------

    /// @notice marks the end of the genesis period
    /// @dev can only be called once
	function completeGenesisGroup() external;

    // ----------- Getters -----------

    /// @notice the address of the FEI contract
    /// @return fei contract
	function fei() external view returns (IFei);

    /// @notice the address of the TRIBE contract
    /// @return tribe contract
	function tribe() external view returns (IERC20);

    /// @notice the address of the GenesisGroup contract
    /// @return genesis group contract
    function genesisGroup() external view returns(address);

    /// @notice determines whether in genesis period or not
    /// @return true if in genesis period
	function hasGenesisGroupCompleted() external view returns(bool);
}
