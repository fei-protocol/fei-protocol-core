pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../token/IFei.sol";
import "../core/ICore.sol";

/// @title A Core Reference contract
/// @author Fei Protocol
/// @notice defines some modifiers and utilities around interacting with Core
interface ICoreRef {

	// ----------- Events -----------

    event CoreUpdate(address indexed _core);

    // ----------- Governor only state changing api -----------

    /// @notice set new Core reference address
    /// @param core the new core address
    function setCore(address core) external;

    // ----------- Getters -----------

    /// @notice address of the Core contract referenced
    /// @return ICore implementation address
	function core() external view returns (ICore);

    /// @notice address of the Fei contract referenced by Core
    /// @return IFei implementation address
    function fei() external view returns (IFei);

    /// @notice address of the Tribe contract referenced by Core
    /// @return IERC20 implementation address
    function tribe() external view returns (IERC20);

    /// @notice fei balance of contract
    /// @return fei amount held
	function feiBalance() external view returns(uint);

    /// @notice tribe balance of contract
    /// @return tribe amount held
    function tribeBalance() external view returns(uint);
}