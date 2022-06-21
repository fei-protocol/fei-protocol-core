// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/*
    Simple OTC Escrow contract to transfer tokens OTC
    Inspired and forked from BadgerDAO 
    https://github.com/Badger-Finance/badger-system/blob/develop/contracts/badger-timelock/OtcEscrow.sol
*/
contract OtcEscrow {
    using SafeERC20 for IERC20;

    address public receivedToken;
    address public sentToken;
    address public recipient;

    address public beneficiary;
    uint256 public receivedAmount;
    uint256 public sentAmount;

    constructor(
        address beneficiary_,
        address recipient_,
        address receivedToken_,
        address sentToken_,
        uint256 receivedAmount_,
        uint256 sentAmount_
    ) {
        beneficiary = beneficiary_;
        recipient = recipient_;

        receivedToken = receivedToken_;
        sentToken = sentToken_;

        receivedAmount = receivedAmount_;
        sentAmount = sentAmount_;
    }

    modifier onlyApprovedParties() {
        require(msg.sender == recipient || msg.sender == beneficiary);
        _;
    }

    /// @dev Atomically trade specified amount of receivedToken for control over sentToken in vesting contract
    /// @dev Either counterparty may execute swap if sufficient token approval is given by recipient
    function swap() public onlyApprovedParties {
        // Transfer expected receivedToken from beneficiary
        IERC20(receivedToken).safeTransferFrom(beneficiary, recipient, receivedAmount);

        // Transfer sentToken to beneficiary
        IERC20(sentToken).safeTransfer(address(beneficiary), sentAmount);
    }

    /// @dev Return sentToken to Fei Protocol to revoke escrow deal
    function revoke() external {
        require(msg.sender == recipient, "onlyRecipient");
        uint256 sentTokenBalance = IERC20(sentToken).balanceOf(address(this));
        IERC20(sentToken).safeTransfer(recipient, sentTokenBalance);
    }

    function revokeReceivedToken() external onlyApprovedParties {
        uint256 receivedTokenBalance = IERC20(receivedToken).balanceOf(address(this));
        IERC20(receivedToken).safeTransfer(beneficiary, receivedTokenBalance);
    }
}
