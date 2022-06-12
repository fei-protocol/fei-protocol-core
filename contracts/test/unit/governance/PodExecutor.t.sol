// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {PodExecutor} from "../../../pods/PodExecutor.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";

/// @notice Fixture to create a dummy proposal. Sends ETH to an address
function dummyBatchProposal(address[] calldata ethReceivers, uint256[] calldata amounts)
    returns (
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory payloads,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    )
{
    targets[0] = ethReceivers[0];
    targets[1] = ethReceivers[1];

    values[0] = amounts[0];
    values[1] = amounts[1];

    payloads[0] = abi.encodePacked(bytes4(keccak256(bytes("transfer(uint256)"))), amounts[0]);
    payloads[1] = abi.encodePacked(bytes4(keccak256(bytes("transfer(uint256)"))), amounts[1]);

    predecessor = bytes32(0);
    salt = bytes32(0);
    delay = 1;
}

/// @notice Dummy proposal that transfers ETH to a target
function dummyProposal(address ethReceiver, uint256 amount)
    returns (
        address target,
        uint256 value,
        bytes memory data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    )
{
    target = ethReceiver;
    value = amount;
    data = abi.encodePacked(bytes4(keccak256(bytes("transfer(uint256)"))), amount);
    predecessor = bytes32(0);
    salt = bytes32(0);
    delay = 1;
}

contract PodExecutorTest is DSTest {
    FeiTestAddresses addresses;
    Core core;
    PodExecutor podExecutor;
    TimelockController timelock;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        addresses = getAddresses();
        core = getCore();

        // 1. Deploy PodExecutor
        podExecutor = new PodExecutor(address(core));

        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.GOVERNOR, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.GOVERNOR, addresses.governorAddress);
        vm.stopPrank();

        // 2. Deploy TimelockController. Set podExecutor as EXECUTOR
        uint256 minDelay = 0;
        address[] memory proposers = new address[](1);
        proposers[0] = address(this);

        address[] memory executors = new address[](1);
        executors[0] = address(podExecutor);

        timelock = new TimelockController(minDelay, proposers, executors);

        // 3. Give timelock some ETH to transfer in proposal
        vm.deal(address(timelock), 2 ether);
    }

    /// @notice Validate can pause execution
    function testCanPause() public {
        vm.prank(addresses.governorAddress);
        podExecutor.pause();

        vm.expectRevert(bytes("Pausable: paused"));
        podExecutor.execute(address(1), address(2), uint256(3), bytes("0x4"), bytes32(0), bytes32("0x123"));
    }

    /// @notice Validate that only an authenticated address can pause
    function testOnlyAuthedAddressCanPause() public {
        vm.expectRevert(bytes("CoreRef: Caller is not a guardian or governor"));
        podExecutor.pause();
    }

    /// @notice Validate that can execute queued proposals
    function testCanExecute() public {
        // 1. Queue a proposal on the timelock
        uint256 ethTransferAmount = 1;
        address receiver = address(2);
        (
            address target,
            uint256 value,
            bytes memory payload,
            bytes32 predecessor,
            bytes32 salt,
            uint256 delay
        ) = dummyProposal(receiver, ethTransferAmount);

        timelock.schedule(target, value, payload, predecessor, salt, delay);

        bytes32 proposalId = timelock.hashOperation(target, value, payload, predecessor, salt);

        // Verify state of queued operation
        assertTrue(timelock.isOperation(proposalId));
        assertTrue(timelock.isOperationPending(proposalId));
        assertFalse(timelock.isOperationReady(proposalId));
        assertFalse(timelock.isOperationDone(proposalId));
        assertGt(timelock.getTimestamp(proposalId), 0);

        // 2. Fast forward time
        vm.warp(block.timestamp + 1);

        // Verify state of now ready operation
        assertTrue(timelock.isOperation(proposalId));
        assertTrue(timelock.isOperationPending(proposalId));
        assertTrue(timelock.isOperationReady(proposalId));
        assertFalse(timelock.isOperationDone(proposalId));
        assertGt(timelock.getTimestamp(proposalId), 0);

        // 3. Execute proposal through PodExecutor
        podExecutor.execute(address(timelock), target, value, payload, predecessor, salt);

        // Verfiy state
        assertTrue(timelock.isOperation(proposalId));
        assertFalse(timelock.isOperationPending(proposalId));
        assertFalse(timelock.isOperationReady(proposalId));
        assertTrue(timelock.isOperationDone(proposalId));
        assertGt(timelock.getTimestamp(proposalId), 0);

        // Verify proposal affect occurred
        assertEq(receiver.balance, ethTransferAmount);
    }

    /// @notice Validate that can batch execute queued proposals
    function testCanBatchExecute() public {}
}
