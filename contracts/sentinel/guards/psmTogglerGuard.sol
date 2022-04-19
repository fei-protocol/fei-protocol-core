// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IGuard.sol";
import "../../oracle/collateralization/CollateralizationOracle.sol";
import "../../pcv/PCVDeposit.sol";
import "../../peg/PegStabilityModule.sol";

contract PSMTogglerGuard is IGuard {
    address private constant DAI =
        address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    uint256 private constant DAI_THRESHOLD = 10000000e18; // 10 milllion DAI

    CollateralizationOracle internal collateralizationOracle =
        CollateralizationOracle(0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257);

    PegStabilityModule private immutable ethPSM;

    constructor(address ethPSMAddress) {
        ethPSM = PegStabilityModule(ethPSMAddress);
    }

    function check() external view override returns (bool) {
        // If the DAI PSM is low on liquidity & the ETH psm is not paused, unpause the ETH psm
        // If the DAI PSM is *not* low on liquidity & the ETH psm is not paused, pause the ETH psm
        // We get the liquidity numbers from the collateralization oracle.

        address[] memory daiDeposits = collateralizationOracle
            .getDepositsForToken(DAI);

        uint256 daiLiquidity = 0;
        for (uint256 i = 0; i < daiDeposits.length; i++) {
            PCVDeposit thisDeposit = PCVDeposit(daiDeposits[i]);
            daiLiquidity += thisDeposit.balance();
        }

        bool overThreshold = daiLiquidity > DAI_THRESHOLD;
        bool ethPSMPaused = ethPSM.paused();

        // We need to take action if...
        return ((overThreshold && !ethPSMPaused) || // we're over the dai threshold and the eth psm is not paused
            (!overThreshold && ethPSMPaused)); // we're under the dai threshold and the eth psm *is* paused
    }

    function getProtecActions()
        external
        view
        override
        returns (
            address[] memory targets,
            bytes[] memory datas,
            uint256[] memory values
        )
    {
        // If we're here, we know that check() has returned true
        // Therefore all we need to do is pause or unpause the ETH psm (ie toggle it)

        targets = new address[](1);
        datas = new bytes[](1);
        values = new uint256[](1);

        targets[0] = address(ethPSM);
        values[0] = 0;

        if (ethPSM.paused()) {
            datas[0] = abi.encodePacked(ethPSM.pause.selector);
        } else {
            datas[0] = abi.encodePacked(ethPSM.unpause.selector);
        }
    }
}
