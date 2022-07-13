pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {ERC20HoldingPCVDeposit} from "../../../pcv/ERC20HoldingPCVDeposit.sol";
import {Core} from "../../../core/Core.sol";
import {MockERC20} from "../../../mock/MockERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";

contract ERC20HoldingPCVDepositTest is DSTest {
    ERC20HoldingPCVDeposit private emptyDeposit;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    MockERC20 private erc20;

    address payable receiver = payable(address(3));

    function setUp() public {
        // Deploy mock token and mint some tokens to an account
        erc20 = new MockERC20();
        Core core = getCore();
        erc20.mint(address(this), 1000);

        emptyDeposit = new ERC20HoldingPCVDeposit(address(core), erc20);
    }

    /// @notice Validate initiate state when deployed
    function testInitialState() public {
        assertEq(emptyDeposit.balanceReportedIn(), address(erc20));
        assertEq(emptyDeposit.balance(), 0);

        (uint256 resistantBalance, uint256 feiBalance) = emptyDeposit.resistantBalanceAndFei();
        assertEq(resistantBalance, 0);
        assertEq(feiBalance, 0);
    }

    /// @notice Validate that reported balances update as expected when tokens are transferred
    function testBalancesUpdate() public {
        erc20.transfer(address(emptyDeposit), 10);
        assertEq(emptyDeposit.balance(), 10);

        (uint256 resistantBalance, uint256 feiBalance) = emptyDeposit.resistantBalanceAndFei();
        assertEq(resistantBalance, 10);
        assertEq(feiBalance, 0);
    }

    /// @notice Validate that deposit() does not perform any state change, it is a noop
    function testDepositIsNoop() public {
        erc20.transfer(address(emptyDeposit), 10);
        emptyDeposit.deposit();

        // Validate balances and tokens on correct still valid
        assertEq(erc20.balanceOf(address(emptyDeposit)), 10);
        assertEq(emptyDeposit.balance(), 10);

        (uint256 resistantBalance, uint256 feiBalance) = emptyDeposit.resistantBalanceAndFei();
        assertEq(resistantBalance, 10);
        assertEq(feiBalance, 0);
    }

    /// @notice Validate that withdraw() withdraws funds
    function testWithdraw() public {
        erc20.transfer(address(emptyDeposit), 10);

        vm.prank(addresses.pcvControllerAddress);
        emptyDeposit.withdraw(receiver, 5);

        assertEq(erc20.balanceOf(address(emptyDeposit)), 5);
        assertEq(erc20.balanceOf(receiver), 5);
    }

    /// @notice Validate that withdrawERC20() does indeed withdraw the specified ERC20
    function testCanWithdrawERC20() public {
        erc20.transfer(address(emptyDeposit), 10);

        vm.prank(addresses.pcvControllerAddress);
        emptyDeposit.withdrawERC20(address(erc20), receiver, 5);

        assertEq(erc20.balanceOf(address(emptyDeposit)), 5);
        assertEq(erc20.balanceOf(receiver), 5);
    }

    /// @notice Validate that can withdraw() from the deposit
    function testCanWithdraw() public {
        erc20.transfer(address(emptyDeposit), 10);

        vm.prank(addresses.pcvControllerAddress);
        emptyDeposit.withdraw(receiver, 10);

        assertEq(erc20.balanceOf(address(emptyDeposit)), 0);
        assertEq(emptyDeposit.balance(), 0);
        assertEq(erc20.balanceOf(receiver), 10);
    }

    /// @notice Validate that can withdrawETH() from the deposit
    function testCanWithdrawEth() public {
        payable(address(emptyDeposit)).transfer(1 ether);

        vm.prank(addresses.pcvControllerAddress);
        emptyDeposit.withdrawETH(receiver, 1 ether);

        assertEq(address(receiver).balance, 1 ether);
    }
}
