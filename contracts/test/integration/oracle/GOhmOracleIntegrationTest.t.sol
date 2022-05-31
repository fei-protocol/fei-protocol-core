// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {GOhmEthOracle} from "../../../oracle/GOhmOracle.sol";
import {CompositeOracle} from "../../../oracle/CompositeOracle.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Decimal, IOracle} from "../../../oracle/IOracle.sol";

import "hardhat/console.sol";

interface RariPriceOracle {
    function price(address) external view returns (uint256);
}

/// @notice Integration test to validate gOHM oracle matches Rari gOHM oracle price
contract GOhmOracleIntegrationTest is DSTest, StdLib {
    GOhmEthOracle public gOhmEthOracle;

    address gOHM = 0x0ab87046fBb341D058F17CBC4c1133F25a20a52f;
    RariPriceOracle public rariOracle = RariPriceOracle(0x057eCDA7f61C73c3Adcc36899d2626C7b79C3249);

    // Chainlink OHM V2 Oracle reporting in terms of ETH
    address chainlinkOHMEthOracle = 0x9a72298ae3886221820B1c878d12D872087D3a23;

    // Chainlink ETH Oracle reporting in terms of USD
    IOracle chainlinkEthUSDOracleWrapper = IOracle(0xCd3c40AE1256922BA16C7872229385E20Bc8351e);

    function setUp() public {
        gOhmEthOracle = new GOhmEthOracle(MainnetAddresses.CORE, chainlinkOHMEthOracle);
    }

    function testValidgOHMPrice() public {
        (Decimal.D256 memory gOhmEthPrice, ) = gOhmEthOracle.read();
        console.log("eth price: ", gOhmEthPrice.value);

        // Eth price is ~$1973. gOHM price is ~$3050
        // Therefore, gOHM price in ETH should be ~ (3050/1973) = 1.55 ETH
        assertGt(gOhmEthPrice.value, 1e18);
        assertLt(gOhmEthPrice.value, 2e18);
    }

    /// @notice Validate that a reasonable USD price can be calculated
    function testValidUSDPrice() public {
        // OHM V2 oracle in terms of USD
        CompositeOracle gOhmUSDOracle = new CompositeOracle(
            MainnetAddresses.CORE,
            gOhmEthOracle,
            chainlinkEthUSDOracleWrapper
        );
        (Decimal.D256 memory gOhmUSDPrice, ) = gOhmUSDOracle.read();
        console.log("gOhmUSDPrice: ", gOhmUSDPrice.value);

        // gOHM price is ~$3000
        assertGt(gOhmUSDPrice.value / 1e18, 2000);
        assertLt(gOhmUSDPrice.value / 1e18, 4000);
    }
}
