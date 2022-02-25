//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../dao/timelock/Timelock.sol";

/** 
 @title Base contract for merger logic
 @author elee, Joey Santoro
 @notice MergerBase is used by all merger contracts. 
 It represents an "AND" gate on both DAOs accepting the contract, and Rari Timelock being owned by the specified DAO.
*/
contract MergerBase {
    event Accept(address indexed dao);
    event Enabled(address indexed caller);

    /// @notice the granularity of the exchange rate
    uint256 public constant scalar = 1e9;

    address public constant rgtTimelock =
        0x8ace03Fc45139fDDba944c6A4082b604041d19FC;
    address public constant tribeTimelock =
        0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;

    bool public rgtAccepted;
    bool public tribeAccepted;

    IERC20 public constant rgt =
        IERC20(0xD291E7a03283640FDc51b121aC401383A46cC623);
    IERC20 public constant tribe =
        IERC20(0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B);

    /// @notice the new DAO to assume governance for rgtTimelock
    address public immutable tribeRariDAO;

    /// @notice tells whether or not both parties have accepted the deal
    bool public bothPartiesAccepted;

    constructor(address _tribeRariDAO) {
        tribeRariDAO = _tribeRariDAO;
    }

    /// @notice function for the rari timelock to accept the deal
    function rgtAccept() external {
        require(msg.sender == rgtTimelock, "Only rari timelock");
        rgtAccepted = true;
        emit Accept(rgtTimelock);
    }

    /// @notice function for the tribe timelock to accept the deal
    function tribeAccept() external {
        require(msg.sender == tribeTimelock, "Only tribe timelock");
        tribeAccepted = true;
        emit Accept(tribeTimelock);
    }

    /// @notice make sure Tribe rari timelock is active
    function setBothPartiesAccepted() external {
        require(!bothPartiesAccepted, "already set");
        require(
            Timelock(payable(rgtTimelock)).admin() == tribeRariDAO,
            "admin not accepted"
        );
        require(tribeAccepted, "Tribe DAO not yet accepted");
        require(rgtAccepted, "Rari DAO not yet accepted");
        bothPartiesAccepted = true;
        emit Enabled(msg.sender);
    }
}
