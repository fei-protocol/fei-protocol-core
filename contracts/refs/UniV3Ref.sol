// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./OracleRef.sol";
import "./IUniV3Ref.sol";

/// @title A Reference to Uniswap
/// @author Fei Protocol
/// @notice defines some utilities around interacting with Uniswap
/// @dev the uniswap position manager should be FEI and another asset
abstract contract UniV3Ref is IUniV3Ref, OracleRef {
    
    // /// @notice the referenced Uniswap router
    // ISwapRouter public override router;

    /// @notice the referenced Uniswap position manager
    INonfungiblePositionManager public override positionManager;

    uint256 public override tokenId;

    /// @notice UniRef constructor
    /// @param _core Fei Core to reference
    /// @param _positionManager Uniswap position manager to reference
    /// @param _token non-fei underlying token
    /// @param _oracle oracle to reference
    /// @param _backupOracle backup oracle to reference
    constructor(
        address _core,
        address _positionManager,
        address _token,
        address _oracle,
        address _backupOracle
    ) OracleRef(_core, _oracle, _backupOracle, 0, false) {
        _setupPositionManager(_positionManager);
        _setDecimalsNormalizerFromToken(_token);
    }

    // /// @notice set the new position manager contract
    // /// @param newPositionManager the new position manager
    // function setPositionManager(address newPositionManager) external virtual override onlyGovernor {
    //     _setupPositionManager(newPositionManager);
    // }

    function _setupPositionManager(address newPositionManager) internal {
        require(newPositionManager != address(0), "UniV3Ref: zero address");

        address oldPositionManager = address(positionManager);
        positionManager = INonfungiblePositionManager(newPositionManager);
        emit PositionManagerUpdate(oldPositionManager, newPositionManager);
    }
}
