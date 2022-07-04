pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {GOhmEthOracle} from "../../../oracle/GOhmEthOracle.sol";
import {MockChainlinkOracle} from "../../../mock/MockChainlinkOracle.sol";
import {Core} from "../../../core/Core.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";

contract GOhmEthOracleTest is DSTest {
    GOhmEthOracle oracle;
    MockChainlinkOracle mockChainlinkOracle;
    uint8 decimals = 18;

    FeiTestAddresses public addresses = getAddresses();
    Core core = getCore();

    function setUp() public {
        mockChainlinkOracle = new MockChainlinkOracle(5, decimals);
        oracle = new GOhmEthOracle(address(core), address(mockChainlinkOracle));
    }

    function testInitialState() public {
        assertEq(address(oracle.chainlinkOHMETHOracle()), address(mockChainlinkOracle));
        assertEq(oracle.oracleDecimalsNormalizer(), uint256(10**decimals));
    }
}
