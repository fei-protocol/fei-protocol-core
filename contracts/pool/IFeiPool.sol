pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

/// @title FeiPool interface
/// @author Fei Protocol
interface IFeiPool {

    // ----------- Governor-only State changing API -----------

    function governorWithdraw(uint256 amount) external;
}
