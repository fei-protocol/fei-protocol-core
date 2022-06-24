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
    address receiver = address(3);

    Core core = Core(MainnetAddresses.CORE);
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
    }

    /// @notice Validate balances update when token is FEI
    function testBalancesUpdateForFei() public {
        ERC20HoldingPCVDeposit emptyFeiDeposit = new ERC20HoldingPCVDeposit(
            address(core),
            IERC20(MainnetAddresses.FEI)
        );
        // TODO: Would need to deploy something at the Fei address

        // Send FEI and check the balance
    }
}
