// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {GOhmEthOracle} from "../../../oracle/GOhmEthOracle.sol";
import {CompositeOracle} from "../../../oracle/CompositeOracle.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Decimal, IOracle} from "../../../oracle/IOracle.sol";
import {Vm} from "../../utils/Vm.sol";

interface RariPriceOracle {
    function price(address) external view returns (uint256);
}

/// @notice Integration test to validate gOHM oracle price
contract GOhmOracleIntegrationTest is DSTest, StdLib {
    GOhmEthOracle public gOhmEthOracle;
    AggregatorV3Interface public chainlinkOHMETHOracle;
    CompositeOracle public gOhmUSDOracle;

    RariPriceOracle public rariOracle = RariPriceOracle(MainnetAddresses.RARI_ORACLE);

    // Chainlink ETH Oracle reporting in terms of USD
    IOracle chainlinkEthUSDOracleWrapper = IOracle(MainnetAddresses.CHAINLINK_ETH_USD_ORACLE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        gOhmEthOracle = new GOhmEthOracle(MainnetAddresses.CORE, MainnetAddresses.CHAINLINK_OHM_V2_ETH_ORACLE);
        chainlinkOHMETHOracle = AggregatorV3Interface(MainnetAddresses.CHAINLINK_OHM_V2_ETH_ORACLE);
        // OHM V2 oracle in terms of USD
        gOhmUSDOracle = new CompositeOracle(MainnetAddresses.CORE, gOhmEthOracle, chainlinkEthUSDOracleWrapper, false);
    }

    /// @notice Validate that reported ETH price is
    function testValidgOHMEthPrice() public {
        (Decimal.D256 memory gOhmEthPrice, bool valid) = gOhmEthOracle.read();

        // Eth price is ~$1000. gOHM price is ~$2400
        // Therefore, gOHM price in ETH should be ~ (2400/1000) = 2.4 ETH
        // This is an order of magnitude check only
        assertGt(gOhmEthPrice.value, 5e17);
        assertLt(gOhmEthPrice.value, 20e18);
        assertTrue(valid);
    }

    /// @notice Validate that ETH oracle price invalid if oracle is stale and not updating
    function testETHPriceInvalidForSlowOracleUpdate() public {
        (, , , uint256 updatedAt, ) = chainlinkOHMETHOracle.latestRoundData();

        uint256 maxOracleUpdateTime = gOhmEthOracle.MAX_ORACLE_UPDATE_TIME();
        vm.warp(updatedAt + maxOracleUpdateTime + 1);

        (, bool valid) = gOhmEthOracle.read();
        assertFalse(valid);
    }

    /// @notice Validate that a reasonable USD price can be calculated
    function testValidUSDPrice() public {
        (Decimal.D256 memory gOhmUSDPrice, bool valid) = gOhmUSDOracle.read();

        // gOHM price is ~$3000
        assertGt(gOhmUSDPrice.value / 1e18, 100);
        assertLt(gOhmUSDPrice.value / 1e18, 10000);
        assertTrue(valid);
    }

    /// @notice Validate composite oracle reports invalid price for stale oracle
    function testUSDPriceInvalidForSlowUpdate() public {
        (, , , uint256 updatedAt, ) = chainlinkOHMETHOracle.latestRoundData();
        uint256 maxOracleUpdateTime = gOhmEthOracle.MAX_ORACLE_UPDATE_TIME();
        vm.warp(updatedAt + maxOracleUpdateTime + 1);

        (, bool valid) = gOhmUSDOracle.read();
        assertFalse(valid);
    }

    /// @notice Validate that the Rari gOHM oracle matches the Fei gOHM oracle
    function testOracleMatchesRari() public {
        (Decimal.D256 memory gOhmEthPrice, ) = gOhmEthOracle.read();
        uint256 rariOracleGOhmPrice = rariOracle.price(MainnetAddresses.GOHM);
        assertEq(gOhmEthPrice.value, rariOracleGOhmPrice);
    }
}
