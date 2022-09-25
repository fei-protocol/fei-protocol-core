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
    Vm public constant vm = Vm(HEVM_ADDRESS);
    address payable receiver = payable(address(3));

    Core core = Core(MainnetAddresses.CORE);
    IERC20 weth = IERC20(MainnetAddresses.WETH);
    IERC20 fei = IERC20(MainnetAddresses.FEI);

    uint256 amount = 2 ether;

    /// @notice Validate that can wrap ETH to WETH
    function testCanWrapEth() public {
        ERC20HoldingPCVDeposit wethDeposit = new ERC20HoldingPCVDeposit(address(core), weth);

        // Forking mainnet, Foundry uses same address to deploy for all users. This contract gets deployed to
        // an EOA which already has funds
        uint256 initialEthBalance = address(wethDeposit).balance;
        assertEq(wethDeposit.balance(), 0); // will not currently have WETH

        payable(address(wethDeposit)).transfer(amount);
        assertEq(address(wethDeposit).balance, amount + initialEthBalance);
        wethDeposit.wrapETH();
        assertEq(address(wethDeposit).balance, 0);

        // Validate WETH balance is reported correctly for all balance functions
        assertEq(weth.balanceOf(address(wethDeposit)), amount + initialEthBalance);
        assertEq(wethDeposit.balance(), amount + initialEthBalance);

        (uint256 resistantBalance, uint256 feiBalance) = wethDeposit.resistantBalanceAndFei();
        assertEq(resistantBalance, amount + initialEthBalance);
        assertEq(feiBalance, 0);
    }

    /// @notice Validate that can withdraw ETH that was wrapped to WETH
    function testCanWithdraWrappedEth() public {
        ERC20HoldingPCVDeposit wethDeposit = new ERC20HoldingPCVDeposit(address(core), weth);
        uint256 initialEthBalance = address(wethDeposit).balance;
        assertEq(wethDeposit.balance(), 0);

        // Transfer ETH to the deposit and wrap it
        payable(address(wethDeposit)).transfer(amount);
        wethDeposit.wrapETH();

        // Withdraw all wrapped ETH and verify balances report correctly
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        wethDeposit.withdrawERC20(MainnetAddresses.WETH, receiver, amount + initialEthBalance);

        assertEq(weth.balanceOf(receiver), amount + initialEthBalance);

        assertEq(weth.balanceOf(address(wethDeposit)), 0);
        assertEq(wethDeposit.balance(), 0);
        (uint256 resistantBalance, uint256 feiBalance) = wethDeposit.resistantBalanceAndFei();
        assertEq(resistantBalance, 0);
        assertEq(feiBalance, 0);
    }

    /// @notice Validate can not deploy for FEI
    function testCanNotDeployForFei() public {
        vm.expectRevert(bytes("FEI not supported"));
        new ERC20HoldingPCVDeposit(address(core), fei);
    }
}
