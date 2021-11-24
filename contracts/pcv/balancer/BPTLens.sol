// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "./IVault.sol";
import "./IWeightedPool.sol";
import "../../external/gyro/ExtendedMath.sol";
import "../IPCVDepositBalances.sol";
import "../../oracle/IOracle.sol";

import "hardhat/console.sol";

/// @title BPTLens
/// @author Fei Protocol
/// @notice a contract to read manipulation resistant balances from BPTs
contract BPTLens is IPCVDepositBalances {
    using ExtendedMath for uint256;

    address public immutable override balanceReportedIn;
    IWeightedPool public immutable pool;
    IVault public constant VAULT = IVault(0xBA12222222228d8Ba445958a75a0704d566BF2C8);
    address public constant FEI = 0x956F47F50A910163D8BF957Cf5846D573E7f87CA;
    bytes32 public immutable id;
    uint256 internal immutable index;
    bool public immutable feiInPair;
    bool public immutable feiIsReportedIn;

    IOracle public immutable reportedOracle;
    IOracle public immutable otherOracle;

    constructor(
        address _token, 
        IWeightedPool _pool,
        IOracle _reportedOracle,
        IOracle _otherOracle
    ) {
        pool = _pool;

        bytes32 _id = _pool.getPoolId();
        id = _id;
        (
            IERC20[] memory tokens,
            uint256[] memory balances,
        ) = VAULT.getPoolTokens(_id); 

        require(address(tokens[0]) == _token || address(tokens[1]) == _token);
        require(tokens.length == 2);
        balanceReportedIn = _token;

        index = address(tokens[0]) == _token ? 0 : 1;

        feiIsReportedIn = _token == FEI;
        feiInPair = address(tokens[0]) == FEI || address(tokens[1]) == FEI;

        reportedOracle = _reportedOracle;
        otherOracle = _otherOracle;
    }

    function balance() public view override returns(uint256) {
        (
            IERC20[] memory _tokens,
            uint256[] memory balances,
        ) = VAULT.getPoolTokens(id); 

        return balances[index];
    }

   /*
     * Calculates the value of Balancer pool tokens using the logic described here:
     * https://docs.gyro.finance/learn/oracles/bpt-oracle
     * This is robust to price manipulations within the Balancer pool.
     * @param pool = address of Balancer pool
     * @param prices = array of prices for underlying assets in the pool, in the same
     * order as pool.getFinalTokens() will return
     */
    function resistantBalanceAndFei() public view override returns(uint256, uint256) {
        uint256[] memory prices = new uint256[](2);
        uint256 j = index == 0 ? 1 : 0;

        (Decimal.D256 memory reportedPrice, bool reportedValid) = reportedOracle.read();
        prices[index] = reportedPrice.value;

        (Decimal.D256 memory otherPrice, bool otherValid) = otherOracle.read();
        prices[j] = otherPrice.value;

        require(reportedValid && otherValid, "BPTLens: Invalid Oracle");

        (
            IERC20[] memory _tokens,
            uint256[] memory balances,
        ) = VAULT.getPoolTokens(id);

        uint256[] memory weights = pool.getNormalizedWeights();

        uint256[] memory reserves = getIdealReserves(balances, prices, weights);
        uint256 i = index;

        if (feiIsReportedIn) {
            return (reserves[index], reserves[index]);
        } 
        if (feiInPair) {
           return (reserves[index], reserves[j]);
        }
        return (reserves[index], 0);
    }

    // TODO optimize gas for case without FEI
    function getIdealReserves(
        uint256[] memory balances,
        uint256[] memory prices,
        uint256[] memory weights
    )
        public
        view
        returns (uint256[] memory reserves)
    {
        /*
            BPTPrice = (p0/w0)^w0 * (p1/w1)^w1 * k
            r0' = BPTPrice * w0/p0
            r0' = ((w0*p1)/(p0*w1))^w1 * k
        */

        uint256 one = uint256(1e18);

        uint256 r0Scaled = one.mulPow(balances[0], weights[0], 18);
        uint256 r1Scaled = one.mulPow(balances[1], weights[1], 18);

        uint256 r0Multiplier = (weights[1] * prices[0] * balances[0]) / (prices[1] * weights[0]);
        uint256 r1Multiplier = (weights[0] * prices[1] * balances[1]) / (prices[0] * weights[1]);
        
        reserves = new uint256[](2);

        reserves[0] = r0Scaled.mulPow(r1Multiplier, weights[1], 18);
        reserves[1] = r1Scaled.mulPow(r0Multiplier, weights[0], 18);

        console.log(reserves[0], reserves[1]);
    }
}
