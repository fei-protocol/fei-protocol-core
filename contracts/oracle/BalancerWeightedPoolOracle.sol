// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "./IOracle.sol";
import "../Constants.sol";
import "../external/Decimal.sol";
import "../external/gyro/ExtendedMath.sol";
import "../external/gyro/abdk/ABDKMath64x64.sol";
import "../pcv/balancer/IVault.sol";
import "../pcv/balancer/IWeightedPool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title BalancerWeightedPoolOracle
/// @author eswak
/// @notice a contract to report the USD value of a Balancer Pool Tokens (LP tokens).
contract BalancerWeightedPoolOracle is IOracle {
    using ExtendedMath for *;
    using ABDKMath64x64 for *;
    using SafeMath for *;
    using Decimal for Decimal.D256;

    /// @notice the Balancer V2 Vault
    IVault public immutable balancerVault;

    /// @notice the Balancer pool to look at
    IWeightedPool public immutable balancerPool;
    bytes32 public immutable balancerPoolId;

    /// @notice the pool tokens (in order)
    IERC20[] public tokens;
    /// @notice the oracle for pool tokens (in order)
    IOracle[] public oracles;

    constructor(IWeightedPool _pool, IOracle[] memory _oracles) {
        balancerPool = _pool;
        oracles = _oracles;

        balancerVault = _pool.getVault();
        balancerPoolId = _pool.getPoolId();
        (tokens, , ) = balancerVault.getPoolTokens(balancerPoolId);
    }

    /// @notice update underlying token oracles
    function update() external override {
        for (uint256 i = 0; i < oracles.length; i++) {
            oracles[i].update();
        }
    }

    /// @notice returns true if one of the underlying oracles are outdated
    function isOutdated() external view override returns (bool outdated) {
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].isOutdated()) {
                return true;
            }
        }
        return false;
    }

    function read() public view override returns (Decimal.D256 memory, bool) {
        return (_getBPTPrice(), true);
    }

    /**
     * Calculates the value of Balancer pool tokens using the logic described here:
     * https://docs.gyro.finance/learn/oracles/bpt-oracle
     * This is robust to price manipulations within the Balancer pool.
     * Courtesy of Gyroscope protocol, used with permission. See the original file here :
     * https://github.com/gyrostable/core/blob/master/contracts/GyroPriceOracle.sol#L109-L167
     * @return bptPrice the price of balancer pool tokens, in USD.
     */
    function _getBPTPrice() internal view returns (Decimal.D256 memory bptPrice) {
        uint256 _bptSupply = balancerPool.totalSupply();
        uint256[] memory _weights = balancerPool.getNormalizedWeights();
        (, uint256[] memory _balances, ) = balancerVault.getPoolTokens(balancerPoolId);

        uint256 _k = uint256(1e18);
        uint256 _weightedProd = uint256(1e18);

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 _tokenBalance = _balances[i];
            uint256 _decimals = ERC20(address(tokens[i])).decimals();
            require(_decimals <= 18, "BalancerWeightedPoolOracle: invalid decimals"); // should never happen
            if (_decimals < 18) {
                _tokenBalance = _tokenBalance.mul(10**(18 - _decimals));
            }

            // if one of the tokens in the pool has zero balance, there is a problem
            // in the pool, so we return zero
            if (_tokenBalance == 0) {
                return Decimal.zero();
            }

            _k = _k.mulPow(_tokenBalance, _weights[i], 18);

            // read oracle
            (Decimal.D256 memory oracleValue, bool oracleValid) = oracles[i].read();
            require(oracleValid, "BPTOracle: invalid oracle");
            uint256 underlyingPrice = oracleValue.mul(1e18).asUint256();
            if (_decimals < 18) {
                underlyingPrice = underlyingPrice * 10**(18 - _decimals);
            }

            _weightedProd = _weightedProd.mulPow(underlyingPrice.scaledDiv(_weights[i], 18), _weights[i], 18);
        }

        uint256 result = _k.scaledMul(_weightedProd).scaledDiv(_bptSupply);
        return Decimal.from(result).div(1e18);
    }
}
