// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {GOhmEthOracle} from "../../../oracle/GOhmEthOracle.sol";
import {CompositeOracle} from "../../../oracle/CompositeOracle.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Decimal, IOracle} from "../../../oracle/IOracle.sol";

interface RariPriceOracle {
    function price(address) external view returns (uint256);
}

/// @notice Integration test to validate gOHM oracle price
contract GOhmOracleIntegrationTest is DSTest, StdLib {
    GOhmEthOracle public gOhmEthOracle;
    RariPriceOracle public rariOracle = RariPriceOracle(MainnetAddresses.RARI_ORACLE);

    // Chainlink ETH Oracle reporting in terms of USD
    IOracle chainlinkEthUSDOracleWrapper = IOracle(MainnetAddresses.CHAINLINK_ETH_USD_ORACLE);

    function setUp() public {
        gOhmEthOracle = new GOhmEthOracle(MainnetAddresses.CORE, MainnetAddresses.CHAINLINK_OHM_V2_ETH_ORACLE);
    }

    function testValidgOHMPrice() public {
        (Decimal.D256 memory gOhmEthPrice, ) = gOhmEthOracle.read();

        // Eth price is ~$1000. gOHM price is ~$2400
        // Therefore, gOHM price in ETH should be ~ (2400/1000) = 2.4 ETH
        // This is an order of magnitude check only
        assertGt(gOhmEthPrice.value, 5e17);
        assertLt(gOhmEthPrice.value, 20e18);
    }

    /// @notice Validate that a reasonable USD price can be calculated
    function testValidUSDPrice() public {
        // OHM V2 oracle in terms of USD
        CompositeOracle gOhmUSDOracle = new CompositeOracle(
            MainnetAddresses.CORE,
            gOhmEthOracle,
            chainlinkEthUSDOracleWrapper,
            false
        );
        (Decimal.D256 memory gOhmUSDPrice, ) = gOhmUSDOracle.read();

        // gOHM price is ~$3000
        assertGt(gOhmUSDPrice.value / 1e18, 100);
        assertLt(gOhmUSDPrice.value / 1e18, 10000);
    }

    /// @notice Validate that the Rari gOHM oracle matches the Fei gOHM oracle
    function testOracleMatchesRari() public {
        (Decimal.D256 memory gOhmEthPrice, ) = gOhmEthOracle.read();
        uint256 rariOracleGOhmPrice = rariOracle.price(MainnetAddresses.GOHM);
        assertEq(gOhmEthPrice.value, rariOracleGOhmPrice);
    }
}
