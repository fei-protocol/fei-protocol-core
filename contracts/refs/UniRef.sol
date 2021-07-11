// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./OracleRef.sol";
import "./IUniRef.sol";

/// @title A Reference to Uniswap
/// @author Fei Protocol
/// @notice defines some utilities around interacting with Uniswap
/// @dev the uniswap pair should be FEI and another asset
abstract contract UniRef is IUniRef, OracleRef {

    /// @notice the referenced Uniswap pair contract
    IUniswapV2Pair public override pair;

    /// @notice the address of the non-fei underlying token
    address public override token;

    /// @notice UniRef constructor
    /// @param _core Fei Core to reference
    /// @param _pair Uniswap pair to reference
    /// @param _oracle oracle to reference
    /// @param _backupOracle backup oracle to reference
    constructor(
        address _core,
        address _pair,
        address _oracle,
        address _backupOracle
    ) OracleRef(_core, _oracle, _backupOracle, 0, false) {
        _setupPair(_pair);
        _setDecimalsNormalizerFromToken(_token());
    }

    /// @notice set the new pair contract
    /// @param newPair the new pair
    function setPair(address newPair) external override virtual onlyGovernor {
        _setupPair(newPair);
    }

    /// @notice pair reserves with fei listed first
    function getReserves()
        public
        view
        override
        returns (uint256 feiReserves, uint256 tokenReserves)
    {
        address token0 = pair.token0();
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        (feiReserves, tokenReserves) = address(fei()) == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        return (feiReserves, tokenReserves);
    }

    function _setupPair(address newPair) internal {
        require(newPair != address(0), "UniRef: zero address");

        address oldPair = address(pair);
        pair = IUniswapV2Pair(newPair);
        emit PairUpdate(oldPair, newPair);

        token = _token();
    }

    function _token() internal view returns (address) {
        address token0 = pair.token0();
        if (address(fei()) == token0) {
            return pair.token1();
        }
        return token0;
    }
}
