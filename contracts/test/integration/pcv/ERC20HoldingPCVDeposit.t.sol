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
    MockERC20 private erc20;

    function setUp() public {
        erc20 = new MockERC20();
        emptyDeposit = new ERC20HoldingPCVDeposit(address(core), erc20);
    }

    /// @notice Validate that can wrap ETH to WETH
    function testCanWrapEth() public {
        payable(address(emptyDeposit)).transfer(2 ether);
        emptyDeposit.wrapETH();

        // Validate WETH balance
        assertEq(weth.balanceOf(address(emptyDeposit)), 2 ether);
    }

    /// @notice Validate that can wrap ETH to WETH
    function testCanWithdraWrappedEth() public {
        payable(address(emptyDeposit)).transfer(2 ether);
        emptyDeposit.wrapETH();

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        emptyDeposit.withdrawETH(receiver, 2 ether);
        assertEq(address(this).balance, 2 ether);
    }

    /// @notice Validate balances update when token is FEI
    function testBalancesUpdateForFei() public {
        ERC20HoldingPCVDeposit emptyFeiDeposit = new ERC20HoldingPCVDeposit(
            address(core),
            IERC20(MainnetAddresses.FEI)
        );

        address feiWhale = 0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2;

        vm.prank(feiWhale);
        fei.transfer(address(emptyFeiDeposit), 10);

        assertEq(emptyFeiDeposit.balance(), 10);

        (uint256 resistantBalance, uint256 feiBalance) = emptyDeposit.resistantBalanceAndFei();
        assertEq(resistantBalance, 0);
        assertEq(feiBalance, 10);
    }
}
