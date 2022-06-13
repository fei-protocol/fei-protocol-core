// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses, DummyStorage} from "../../utils/Fixtures.sol";
import {Tribe} from "../../../tribe/Tribe.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

/// @notice Fixture to create a dummy proposal
function createDummyProposal(address dummyContract, uint256 newVariable)
    returns (
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory,
        bytes32
    )
{
    address[] memory targets = new address[](1);
    targets[0] = dummyContract;

    uint256[] memory values = new uint256[](1);
    values[0] = uint256(0);

    bytes[] memory calldatas = new bytes[](1);
    bytes memory data = abi.encodePacked(bytes4(keccak256(bytes("setVariable(uint256)"))), newVariable);
    calldatas[0] = data;

    string memory description = "Dummy proposal";
    bytes32 descriptionHash = keccak256(bytes(description));
    return (targets, values, calldatas, description, descriptionHash);
}

/// @dev Validates vote counting functionality of the GovernorCountingFor module. Module is abstract
///      so instantiated as a NopeDAO
contract GovernorCountingFor is DSTest {
    address userWithTribe = address(0x1);
    address userWithInsufficientTribe = address(0x2);
    address userWithZeroTribe = address(0x3);

    uint256 excessQuorumTribe = (11e6) * (10**18);
    address tribeAddress;
    ERC20VotesComp tribe;
    DummyStorage dummyStorageContract;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    NopeDAO private nopeDAO;
    Core private core;

    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        // 1. Setup core
        core = getCore();

        // 2. Setup Tribe and transfer some to a test address
        tribeAddress = address(core.tribe());

        vm.startPrank(addresses.governorAddress);
        core.allocateTribe(userWithTribe, excessQuorumTribe);
        core.allocateTribe(userWithInsufficientTribe, 5e6 * (10**18));
        vm.stopPrank();

        tribe = ERC20VotesComp(tribeAddress);

        vm.prank(userWithTribe);
        tribe.delegate(userWithTribe);

        // 3. Deploy NopeDAO
        nopeDAO = new NopeDAO(tribe, address(core));

        vm.roll(block.number + 1); // Make block number non-zero, for getVotes accounting
    }

    /// @notice Validate that a FOR vote is counted
    function testCountForVote() public {}

    /// @notice Validate that multiple FOR votes are counted
    function testCountMultipleForVotes() public {}

    /// @notice Validate that a non-FOR vote is rejected
    function testRejectsNonForVote() public {}

    /// @notice Validate that votes are always counted as having succeeded
    function testVoteSucceededAlwaysTrue() public {}

    /// @notice Validate that quorum can be reached with sufficient FOR votes
    function testQuorumCanBeReached() public {}
}
