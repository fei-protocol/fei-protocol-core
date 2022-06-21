// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IVault.sol";
import "./IWeightedPool.sol";
import "../../external/gyro/ExtendedMath.sol";
import "../IPCVDepositBalances.sol";
import "../../oracle/IOracle.sol";
import "../../Constants.sol";

/// @title BPTLens
/// @author Fei Protocol
/// @notice a contract to read manipulation resistant balances from BPTs
contract BPTLens is IPCVDepositBalances {
    using ExtendedMath for uint256;

    /// @notice the token the lens reports balances in
    address public immutable override balanceReportedIn;

    /// @notice the balancer pool to look at
    IWeightedPool public immutable pool;

    /// @notice the Balancer V2 Vault
    IVault public immutable VAULT;

    // the pool id on balancer
    bytes32 internal immutable id;

    // the index of balanceReportedIn on the pool
    uint256 internal immutable index;

    /// @notice true if FEI is in the pair
    bool public immutable feiInPair;

    /// @notice true if FEI is the reported balance
    bool public immutable feiIsReportedIn;

    /// @notice the oracle for balanceReportedIn token
    IOracle public immutable reportedOracle;

    /// @notice the oracle for the other token in the pair (not balanceReportedIn)
    IOracle public immutable otherOracle;

    constructor(
        address _token,
        IWeightedPool _pool,
        IOracle _reportedOracle,
        IOracle _otherOracle,
        bool _feiIsReportedIn,
        bool _feiIsOther
    ) {
        pool = _pool;
        IVault _vault = _pool.getVault();
        VAULT = _vault;

        bytes32 _id = _pool.getPoolId();
        id = _id;
        (IERC20[] memory tokens, uint256[] memory balances, ) = _vault.getPoolTokens(_id);

        // Check the token is in the BPT and its only a 2 token pool
        require(address(tokens[0]) == _token || address(tokens[1]) == _token);
        require(tokens.length == 2);
        balanceReportedIn = _token;

        index = address(tokens[0]) == _token ? 0 : 1;

        feiIsReportedIn = _feiIsReportedIn;
        feiInPair = _feiIsReportedIn || _feiIsOther;

        reportedOracle = _reportedOracle;
        otherOracle = _otherOracle;
    }

    function balance() public view override returns (uint256) {
        (IERC20[] memory _tokens, uint256[] memory balances, ) = VAULT.getPoolTokens(id);

        return balances[index];
    }

    /**
     * @notice Calculates the manipulation resistant balances of Balancer pool tokens using the logic described here:
     * https://docs.gyro.finance/learn/oracles/bpt-oracle
     * This is robust to price manipulations within the Balancer pool.
     */
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256[] memory prices = new uint256[](2);
        uint256 j = index == 0 ? 1 : 0;

        // Check oracles and fill in prices
        (Decimal.D256 memory reportedPrice, bool reportedValid) = reportedOracle.read();
        prices[index] = reportedPrice.value;

        (Decimal.D256 memory otherPrice, bool otherValid) = otherOracle.read();
        prices[j] = otherPrice.value;

        require(reportedValid && otherValid, "BPTLens: Invalid Oracle");

        (IERC20[] memory _tokens, uint256[] memory balances, ) = VAULT.getPoolTokens(id);

        uint256[] memory weights = pool.getNormalizedWeights();

        // uses balances, weights, and prices to calculate manipulation resistant reserves
        uint256 reserves = _getIdealReserves(balances, prices, weights, index);

        if (feiIsReportedIn) {
            return (reserves, reserves);
        }
        if (feiInPair) {
            uint256 otherReserves = _getIdealReserves(balances, prices, weights, j);
            return (reserves, otherReserves);
        }
        return (reserves, 0);
    }

    /*
        let r represent reserves and r' be ideal reserves (derived from manipulation resistant variables)
        p are resistant oracle prices of the tokens
        w are the balancer weights
        k is the balancer invariant

        BPTPrice = (p0/w0)^w0 * (p1/w1)^w1 * k
        r0' = BPTPrice * w0/p0
        r0' = ((w0*p1)/(p0*w1))^w1 * k

        Now including k allows for further simplification
        k = r0^w0 * r1^w1

        r0' = r0^w0 * r1^w1 * ((w0*p1)/(p0*w1))^w1
        r0' = r0^w0 * ((w0*p1*r1)/(p0*w1))^w1
    */
    function _getIdealReserves(
        uint256[] memory balances,
        uint256[] memory prices,
        uint256[] memory weights,
        uint256 i
    ) internal pure returns (uint256 reserves) {
        uint256 j = i == 0 ? 1 : 0;

        uint256 one = Constants.ETH_GRANULARITY;

        uint256 reservesScaled = one.mulPow(balances[i], weights[i], Constants.ETH_DECIMALS);
        uint256 multiplier = (weights[i] * prices[j] * balances[j]) / (prices[i] * weights[j]);

        reserves = reservesScaled.mulPow(multiplier, weights[j], Constants.ETH_DECIMALS);
    }
}
