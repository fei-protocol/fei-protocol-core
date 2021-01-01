pragma solidity ^0.6.2;

/// @title a PCV Deposit interface
/// @author Fei Protocol
interface IPCVDeposit {

	// ----------- Events -----------
    event Deposit(address indexed _from, uint _amount);

    event Withdrawal(address indexed _caller, address indexed _to, uint _amount);

    // ----------- State changing api -----------

    /// @notice deposit tokens into the PCV allocation
    /// @param amount of tokens deposited
    function deposit(uint amount) external payable;

    // ----------- PCV Controller only state changing api -----------

    /// @notice withdraw tokens from the PCV allocation
    /// @param amount of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint amount) external;

    // ----------- Getters -----------
    
    /// @notice returns total value of PCV in the Deposit
    function totalValue() external view returns(uint);
}
