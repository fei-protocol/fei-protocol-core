pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

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
    constructor(
        address _core,
        address _pair,
        address _oracle
    ) public OracleRef(_core, _oracle) {
        _setupPair(_pair);
    }

    /// @notice set the new pair contract
    /// @param _pair the new pair
    function setPair(address _pair) external override virtual onlyGovernor {
        _setupPair(_pair);
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

    function _setupPair(address _pair) internal {
        pair = IUniswapV2Pair(_pair);
        emit PairUpdate(_pair);

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
