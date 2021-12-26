// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../pcv/balancer/IMerkleOrchard.sol";
import "./MockERC20.sol";

contract MockMerkleOrchard is IMerkleOrchard {
    MockERC20 public balToken;

    constructor(address _balToken) {
        balToken = MockERC20(_balToken);
    }

    function claimDistributions(
        address claimer,
        Claim[] memory claims,
        IERC20[] memory tokens
    ) external override {
        balToken.mint(claimer, claims[0].balance);
    }
}
