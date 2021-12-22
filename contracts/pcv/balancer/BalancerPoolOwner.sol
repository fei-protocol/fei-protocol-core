// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IBasePool.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @title BalancerPoolOwner
/// @author Fei Protocol
/// @notice a contract that can perform admin functions on Balancer pools
contract BalancerPoolOwner is CoreRef, Initializable {

    constructor(address _core) CoreRef(_core) {}

    /// @param _core The Core contract address.
    function initialize(address _core) external initializer {
        CoreRef._initialize(_core);

        _setContractAdminRole(keccak256("AMM_FEE_ADMIN_ROLE"));
    }

    /// @notice set the swap fees in a given pool. This contract must be the
    /// pool owner, otherwise the call will revert.
    function setSwapFeePercentage(address _pool, uint256 swapFeePercentage) external onlyGovernorOrAdmin {
        IBasePool(_pool).setSwapFeePercentage(swapFeePercentage);
    }
}
