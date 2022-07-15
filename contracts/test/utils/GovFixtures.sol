// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../core/Core.sol";
import {Vm} from "./Vm.sol";

/// @notice Dummy contract used to test NopeDAO and Safe proposals
contract DummyStorage {
    uint256 private variable = 5;

    function getVariable() external view returns (uint256) {
        return variable;
    }

    function setVariable(uint256 x) external {
        variable = x;
    }
}

/// @notice Setup various users with Tribe delegated to them for DAO voting
function getDAOMembers(
    Core core,
    ERC20VotesComp tribe,
    address governor,
    Vm vm
)
    returns (
        address,
        address,
        address,
        address
    )
{
    uint256 excessQuorumTribe = (11e6) * (10**18);

    address userWithQuorumTribe = address(0x100);
    address userWith5MTribe = address(0x101);
    address userWith2MTribe = address(0x102);
    address userWithZeroTribe = address(0x103);

    // 2. Setup Tribe, grant to test addresses and delegate
    vm.startPrank(governor);
    core.allocateTribe(userWithQuorumTribe, excessQuorumTribe);
    core.allocateTribe(userWith5MTribe, 5e6 * (10**18));
    core.allocateTribe(userWith2MTribe, 2e6 * (10**18));
    vm.stopPrank();

    // Delegate TRIBE to users, allowing them to vote
    vm.prank(userWithQuorumTribe);
    tribe.delegate(userWithQuorumTribe);

    vm.prank(userWith5MTribe);
    tribe.delegate(userWith5MTribe);

    vm.prank(userWith2MTribe);
    tribe.delegate(userWith2MTribe);

    return (userWithQuorumTribe, userWith5MTribe, userWith2MTribe, userWithZeroTribe);
}

/// @notice Fixture to create a dummy proposal that transfers an amount of ETH to a receiver
function createDummyEthProposal(address ethReceiver, uint256 ethAmount)
    pure
    returns (
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory,
        bytes32
    )
{
    address[] memory targets = new address[](1);
    targets[0] = ethReceiver;

    uint256[] memory values = new uint256[](1);
    values[0] = ethAmount;

    bytes[] memory calldatas = new bytes[](1);
    bytes memory data = "";
    calldatas[0] = data;

    string memory description = "Dummy proposal to send ETH";
    bytes32 descriptionHash = keccak256(bytes(description));
    return (targets, values, calldatas, description, descriptionHash);
}

/// @notice Fixture to create a dummy proposal which sets a storage variable on a dummy contract
function createDummyStorageVarProposal(address dummyContract, uint256 newVariable)
    pure
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
