// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.15;

import "../shutdown/fuse/RariMerkleRedeemer.sol";

contract MockRariMerkleRedeemerNoSigs is RariMerkleRedeemer {
    constructor(
        address token,
        address[] memory cTokens,
        uint256[] memory rates,
        bytes32[] memory roots
    ) RariMerkleRedeemer(token, cTokens, rates, roots) {}

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata _signature) internal override {
        // check: ensure that the user hasn't yet signed
        // note: you can't directly compare bytes storage ref's to each other, but you can keccak the empty bytes
        // such as the one from address zero, and compare this with the keccak'd other bytes; msg.sender *cannot* be the zero address
        require(
            keccak256(userSignatures[msg.sender]) == keccak256(userSignatures[address(0)]),
            "User has already signed"
        );

        // check: to ensure the signature is a valid signature for the constant message string from msg.sender
        // @todo - do we want to use this, which supports ERC1271, or *just* EOA signatures?
        // @dev signature check *reomved* for testing
        //require(SignatureChecker.isValidSignatureNow(msg.sender, MESSAGE_HASH, _signature), "Signature not valid.");

        // effect: update user's stored signature
        userSignatures[msg.sender] = _signature;
    }
}
