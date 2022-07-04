// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {GOhmEthOracle} from "../../../oracle/GOhmETHOracle.sol";
import {CompositeOracle} from "../../../oracle/CompositeOracle.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Decimal, IOracle} from "../../../oracle/IOracle.sol";

interface RariPriceOracle {
    function price(address) external view returns (uint256);
}

/// @notice Integration test to validate gOHM oracle price
contract GOhmOracleIntegrationTest is DSTest, StdLib {
    GOhmEthOracle public gOhmEthOracle;

    address gOHM = 0x0ab87046fBb341D058F17CBC4c1133F25a20a52f;
    RariPriceOracle public rariOracle = RariPriceOracle(0x1887118E49e0F4A78Bd71B792a49dE03504A764D);

    // Chainlink OHM V2 Oracle reporting in terms of ETH
    address chainlinkOHMEthOracle = 0x9a72298ae3886221820B1c878d12D872087D3a23;

    // Chainlink ETH Oracle reporting in terms of USD
    IOracle chainlinkEthUSDOracleWrapper = IOracle(0xCd3c40AE1256922BA16C7872229385E20Bc8351e);

    function setUp() public {
        gOhmEthOracle = new GOhmEthOracle(MainnetAddresses.CORE, chainlinkOHMEthOracle);
    }

    function testValidgOHMPrice() public {
        (Decimal.D256 memory gOhmEthPrice, ) = gOhmEthOracle.read();

        // Eth price is ~$1000. gOHM price is ~$2400
        // Therefore, gOHM price in ETH should be ~ (2400/1000) = 2.4 ETH
        assertGt(gOhmEthPrice.value, 1e18);
        assertLt(gOhmEthPrice.value, 5e18);
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
        assertGt(gOhmUSDPrice.value / 1e18, 1000);
        assertLt(gOhmUSDPrice.value / 1e18, 5000);
    }

    /// @notice Validate that the Rari gOHM oracle matches the Fei gOHM oracle
    function testOracleMatchesRari() public {
        (Decimal.D256 memory gOhmEthPrice, ) = gOhmEthOracle.read();
        uint256 rariOracleGOhmPrice = rariOracle.price(gOHM);
        assertEq(gOhmEthPrice.value, rariOracleGOhmPrice);
    }
}
