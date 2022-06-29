pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {ERC20HoldingPCVDeposit} from "../../../pcv/ERC20HoldingPCVDeposit.sol";
import {Core} from "../../../core/Core.sol";
import {MockERC20} from "../../../mock/MockERC20.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";

contract ERC20HoldingPCVDepositIntegrationTest is DSTest {
    ERC20HoldingPCVDeposit private emptyDeposit;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    address payable receiver = payable(address(3));

    Core core = Core(MainnetAddresses.CORE);
    IERC20 weth = IERC20(MainnetAddresses.WETH);
    IERC20 fei = IERC20(MainnetAddresses.FEI);

    function setUp() public {
        emptyDeposit = new ERC20HoldingPCVDeposit(address(core), weth);
    }

    /// @notice Validate that can withdraw ETH that was wrapped to WETH
    function testCanWithdraWrappedEth() public {
        payable(address(emptyDeposit)).transfer(2 ether);
        emptyDeposit.wrapETH();

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        emptyDeposit.withdrawERC20(MainnetAddresses.WETH, receiver, 2 ether);
        assertEq(weth.balanceOf(receiver), 2 ether);
    }

    /// @notice Validate that can wrap ETH to WETH
    function testCanWrapEth() public {
        ERC20HoldingPCVDeposit emptyNewDeposit = new ERC20HoldingPCVDeposit(address(core), weth);
        payable(address(emptyNewDeposit)).transfer(2 ether);
        emptyNewDeposit.wrapETH();

        // Validate WETH balance
        assertEq(weth.balanceOf(address(emptyNewDeposit)), 2 ether);
    }

    /// @notice Validate can not deploy for FEI
    function testCanNotDeployForFei() public {
        vm.expectRevert(bytes("FEI not supported"));
        ERC20HoldingPCVDeposit feiDeposit = new ERC20HoldingPCVDeposit(address(core), fei);
    }
}
