pragma solidity ^0.6.2;

/// @title a PCV Deposit interface
/// @author Fei Protocol
interface IPCVDeposit {

    // State updating api

    /// @notice deposit tokens into the PCV allocation
    /// @param amount of tokens deposited
    function deposit(uint256 amount) external payable;

    // PCV Controller only state updating api

    /// @notice withdraw tokens from the PCV allocation
    /// @param amount of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amount) external;

    /// @notice returns total value of PCV in the Deposit
    function totalValue() external view returns(uint256);
}
