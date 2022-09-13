pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../../utils/Vm.sol";
import {DSTest} from "../../../utils/DSTest.sol";
import {ERC20HoldingPCVDeposit} from "../../../../pcv/ERC20HoldingPCVDeposit.sol";
import {Core} from "../../../../core/Core.sol";
import {MockERC20} from "../../../../mock/MockERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../../utils/Fixtures.sol";

contract RariMerkleRedeemerTest is DSTest {
    function setUp() public {
        revert("Not implemented");
    }

    // @todo: test reverting on an invalid base token
    // @todo: test happy path
    // @todo: test approvals
    // @todo: test redeeming literally everything
    // @todo: test withdrawing leftover tokens
}
