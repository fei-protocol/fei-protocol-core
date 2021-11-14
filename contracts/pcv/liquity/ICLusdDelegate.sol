// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../external/CErc20Delegator.sol";

/// @title a CLusdDelegate interface
/// @author Fei Protocol
interface ICLusdDelegate is CErc20Delegator {

    // ----------- State changing api -----------

    function _becomeImplementation(bytes calldata data) external;

    function claimLqty(address account) external view returns (uint256);

    // ----------- View only api -----------

    function stabilityPool() external view returns(address);

    function lusdSwapper() external view returns(address);

    function BAMM() external view returns(address);

    function lqty() external view returns(address);

    function buffer() external view returns(uint256);

    function ethSwapMin() external view returns(uint256);
}
