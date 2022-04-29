pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IFei} from "../../fei/IFei.sol";
import {Fei} from "../../fei/Fei.sol";
import {ICore} from "../../core/ICore.sol";
import {Core} from "../../core/Core.sol";
import {Vm} from "../utils/Vm.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../utils/Fixtures.sol";

contract FeiTest is DSTest {
    IFei private fei;
    ICore private core;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        core = getCore();

        fei = core.fei();
    }

    function testDeployedMetaData() public {
        assertEq(fei.totalSupply(), 0);
        assertTrue(core.isGovernor(addresses.governorAddress));
    }

    function testMintsFei() public {
        uint256 mintAmount = 100;

        vm.prank(addresses.minterAddress);
        fei.mint(addresses.userAddress, mintAmount);

        assertEq(fei.balanceOf(addresses.userAddress), mintAmount);
    }
}
