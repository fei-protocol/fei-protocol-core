pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICore} from "../../core/ICore.sol";
import {Core} from "../../core/Core.sol";
import {PegStabilityModule} from "../../peg/PegStabilityModule.sol";
import {PCVSentinel} from "../../sentinel/PCVSentinel.sol";
import {PSMTogglerGuard} from "../../sentinel/guards/psmTogglerGuard.sol";
import {Vm} from "../utils/Vm.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getEthPSM, getCore, getAddresses, FeiTestAddresses} from "../utils/Fixtures.sol";

contract PCVSentinelTest is DSTest {
    ICore private core;
    PegStabilityModule private ethPSM;
    PCVSentinel private pcvSentinel;
    PSMTogglerGuard private togglerGuard;
    IERC20 private dai;
    IERC20 private fei;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        core = getCore();
        fei = core.fei();
        ethPSM = getEthPSM(address(core));
        pcvSentinel = new PCVSentinel(address(core));
        togglerGuard = new PSMTogglerGuard(address(ethPSM));

        vm.etch(
            0x6B175474E89094C44Da98b954EedeAC495271d0F,
            vm.getCode("../../../artifacts/contracts/fei/Fei.sol")
        );

        vm.prank(addresses.guardianAddress);

        pcvSentinel.knight(address(togglerGuard));
    }

    function testTogglerGuard() public {
        assert(pcvSentinel.isGuard(address(togglerGuard)));

        vm.prank(0x6B175474E89094C44Da98b954EedeAC495271d0F); // DAI
    }
}
