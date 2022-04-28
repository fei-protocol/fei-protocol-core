// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IGnosisSafe} from "../../../pods/interfaces/IGnosisSafe.sol";
import {Vm} from "../../utils/Vm.sol";

/// @notice Create a Gnosis Safe transaction
function createGnosisTx(
    address safe,
    address txTarget,
    bytes memory txData,
    uint256 ownerPrivateKey,
    Vm vm
) returns (bool) {
    {
        bytes memory gnosisDataToSign = IGnosisSafe(safe).encodeTransactionData(
            txTarget,
            0, // value
            txData,
            IGnosisSafe.Operation.Call, // Operation
            1_000_000, // safeTxGas
            0, // baseGas
            0, // gasPrice
            address(0), // gasToken
            payable(address(0)), // refundReceiver
            0 // Nonce
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, keccak256(gnosisDataToSign));
        bytes memory signatures = abi.encodePacked(r, s, v);

        bool success = IGnosisSafe(safe).execTransaction(
            txTarget, // should the target be the timelock or the dummy contract?
            0, // value
            txData, // 1m max
            IGnosisSafe.Operation.Call, // CALL, rather than DELEGATECALL
            1_000_000, // safeTxGas
            0, // baseGas
            0, // gasPrice
            address(0), // gasToken
            payable(address(0)), // refundReceiver
            signatures // Packed signatures
        );
        return success;
    }
}
