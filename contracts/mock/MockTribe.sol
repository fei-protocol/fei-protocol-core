// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";

contract MockTribe is MockERC20 {
    mapping (address => address) public delegates;

    // note : this is a naive implementation for mocking, it allows a token
    //        owner to double delegate.
    function delegate(address account) external {
      delegates[account] = msg.sender;
    }

    function getCurrentVotes(address account) external view returns (uint256) {
      uint256 votes = balanceOf(account);
      if (delegates[account] != address(0)) {
        votes = votes + balanceOf(delegates[account]);
      }
      return votes;
    }
}
