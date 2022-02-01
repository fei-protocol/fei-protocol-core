// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Forked from Compound
// See https://github.com/compound-finance/compound-protocol/blob/master/contracts/Timelock.sol
contract Timelock {
    using SafeMath for uint;

    event NewAdmin(address indexed newAdmin);
    event NewPendingAdmin(address indexed newPendingAdmin);
    event NewDelay(uint indexed newDelay);
    event CancelTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta);
    event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta);
    event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);

    uint public constant GRACE_PERIOD = 14 days;
    uint public immutable MINIMUM_DELAY;
    uint public constant MAXIMUM_DELAY = 30 days;

    address public admin;
    address public pendingAdmin;
    uint public delay;

    mapping (bytes32 => bool) public queuedTransactions;


    constructor(address admin_, uint delay_, uint minDelay_) {
        MINIMUM_DELAY = minDelay_;
        require(delay_ >= minDelay_, "Timelock: Delay must exceed minimum delay.");
        require(delay_ <= MAXIMUM_DELAY, "Timelock: Delay must not exceed maximum delay.");
        require(admin_ != address(0), "Timelock: Admin must not be 0 address");

        admin = admin_;
        delay = delay_;
    }

    receive() external payable { }

    function setDelay(uint delay_) public {
        require(msg.sender == address(this), "Timelock: Call must come from Timelock.");
        require(delay_ >= MINIMUM_DELAY, "Timelock: Delay must exceed minimum delay.");
        require(delay_ <= MAXIMUM_DELAY, "Timelock: Delay must not exceed maximum delay.");
        delay = delay_;

        emit NewDelay(delay);
    }

    function acceptAdmin() public {
        require(msg.sender == pendingAdmin, "Timelock: Call must come from pendingAdmin.");
        admin = msg.sender;
        pendingAdmin = address(0);

        emit NewAdmin(admin);
    }

    function setPendingAdmin(address pendingAdmin_) public {
        require(msg.sender == address(this), "Timelock: Call must come from Timelock.");
        pendingAdmin = pendingAdmin_;

        emit NewPendingAdmin(pendingAdmin);
    }

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public virtual returns (bytes32) {
        require(msg.sender == admin, "Timelock: Call must come from admin.");
        require(eta >= getBlockTimestamp().add(delay), "Timelock: Estimated execution block must satisfy delay.");

        bytes32 txHash = getTxHash(target, value, signature, data, eta);
        queuedTransactions[txHash] = true;

        emit QueueTransaction(txHash, target, value, signature, data, eta);
        return txHash;
    }

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public {
        require(msg.sender == admin, "Timelock: Call must come from admin.");

        _cancelTransaction(target, value, signature, data, eta);
    }

    function _cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) internal {
        bytes32 txHash = getTxHash(target, value, signature, data, eta);
        queuedTransactions[txHash] = false;

        emit CancelTransaction(txHash, target, value, signature, data, eta);
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public virtual payable returns (bytes memory) {
        require(msg.sender == admin, "Timelock: Call must come from admin.");

        bytes32 txHash = getTxHash(target, value, signature, data, eta);
        require(queuedTransactions[txHash], "Timelock: Transaction hasn't been queued.");
        require(getBlockTimestamp() >= eta, "Timelock: Transaction hasn't surpassed time lock.");
        require(getBlockTimestamp() <= eta.add(GRACE_PERIOD), "Timelock: Transaction is stale.");

        queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = target.call{value: value}(callData); //solhint-disable avoid-call-value
        require(success, "Timelock: Transaction execution reverted.");

        emit ExecuteTransaction(txHash, target, value, signature, data, eta);

        return returnData;
    }

    function getTxHash(address target, uint value, string memory signature, bytes memory data, uint eta) public pure returns (bytes32) {
        return keccak256(abi.encode(target, value, signature, data, eta));
    }

    function getBlockTimestamp() internal view returns (uint) {
        return block.timestamp;
    }
}