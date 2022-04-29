// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "./IVault.sol";
import "./IWeightedPool.sol";
import "../../external/gyro/ExtendedMath.sol";
import "../IPCVDepositBalances.sol";
import "../../oracle/IOracle.sol";
import "../../Constants.sol";

/// @title BalancerPool2Lens
/// @author Fei Protocol
/// @notice a contract to read tokens & fei out of a contract that reports balance in Balancer LP tokens.
/// Limited to BPTs that have 2 underlying tokens.
/// @notice this contract use code similar to BPTLens (that reads a whole pool).
contract BalancerPool2Lens is IPCVDepositBalances {
    using ExtendedMath for uint256;

    /// @notice FEI token address
    address private constant FEI = 0x956F47F50A910163D8BF957Cf5846D573E7f87CA;

    /// @notice the deposit inspected
    address public immutable depositAddress;

    /// @notice the token the lens reports balances in
    address public immutable override balanceReportedIn;

    /// @notice the balancer pool to look at
    IWeightedPool public immutable pool;

    /// @notice the Balancer V2 Vault
    IVault public immutable balancerVault;

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
        address _depositAddress,
        address _token,
        IWeightedPool _pool,
        IOracle _reportedOracle,
        IOracle _otherOracle,
        bool _feiIsReportedIn,
        bool _feiIsOther
    ) {
        depositAddress = _depositAddress;

        pool = _pool;
        IVault _vault = _pool.getVault();
        balancerVault = _vault;

        bytes32 _id = _pool.getPoolId();
        id = _id;
        (IERC20[] memory tokens, , ) = _vault.getPoolTokens(_id);

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
        (, uint256[] memory balances, ) = balancerVault.getPoolTokens(id);
        uint256 bptsOwned = IPCVDepositBalances(depositAddress).balance();
        uint256 totalSupply = pool.totalSupply();

        return (balances[index] * bptsOwned) / totalSupply;
    }

    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256[] memory prices = new uint256[](2);
        uint256 j = index == 0 ? 1 : 0;

        // Check oracles and fill in prices
        (Decimal.D256 memory reportedPrice, bool reportedValid) = reportedOracle.read();
        prices[index] = reportedPrice.value;

        (Decimal.D256 memory otherPrice, bool otherValid) = otherOracle.read();
        prices[j] = otherPrice.value;

        require(reportedValid && otherValid, "BPTLens: Invalid Oracle");

        (, uint256[] memory balances, ) = balancerVault.getPoolTokens(id);
        uint256 bptsOwned = IPCVDepositBalances(depositAddress).balance();
        uint256 totalSupply = pool.totalSupply();

        uint256[] memory weights = pool.getNormalizedWeights();

        // uses balances, weights, and prices to calculate manipulation resistant reserves
        uint256 reserves = _getIdealReserves(balances, prices, weights, index);
        // if the deposit owns x% of the pool, only keep x% of the reserves
        reserves = (reserves * bptsOwned) / totalSupply;

        if (feiIsReportedIn) {
            return (reserves, reserves);
        }
        if (feiInPair) {
            uint256 otherReserves = _getIdealReserves(balances, prices, weights, j);
            otherReserves = (otherReserves * bptsOwned) / totalSupply;
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
