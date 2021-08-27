// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./Timelock.sol";
import "../refs/CoreRef.sol";

// Timelock with veto admin roles
contract OptimisticTimelock is Timelock, CoreRef {

    constructor(address core_, address admin_, uint delay_, uint minDelay_) 
        Timelock(admin_, delay_, minDelay_)
        CoreRef(core_)
    {}

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public override whenNotPaused returns (bytes32) {
        return super.queueTransaction(target, value, signature, data, eta);
    }

    function vetoTransactions(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory datas, uint[] memory etas) public onlyGuardianOrGovernor {
        for (uint i = 0; i < targets.length; i++) {
            _cancelTransaction(targets[i], values[i], signatures[i], datas[i], etas[i]);
        }
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public override whenNotPaused payable returns (bytes memory) {
        return super.executeTransaction(target, value, signature, data, eta);
    }

    function governorSetPendingAdmin(address newAdmin) public onlyGovernor {
        pendingAdmin = newAdmin;
        emit NewPendingAdmin(newAdmin);
    }
}