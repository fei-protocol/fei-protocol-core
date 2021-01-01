pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title FEI stablecoin interface
/// @author Fei Protocol
interface IFei is IERC20 {

	// ----------- Events -----------

    event Minting(address indexed _to, address indexed _minter, uint _amount);

    event Burning(address indexed _to, address indexed _burner, uint _amount);

    event IncentiveContractUpdate(address indexed _incentivized, address indexed _incentiveContract);

    // ----------- State changing api -----------

    /// @notice burn FEI tokens from caller
    /// @param amount the amount to burn
    function burn(uint amount) external;

    // ----------- Burner only state changing api -----------

    /// @notice burn FEI tokens from specified account
    /// @param account the account to burn from
    /// @param amount the amount to burn
    function burnFrom(address account, uint amount) external;

    // ----------- Minter only state changing api -----------

    /// @notice mint FEI tokens
    /// @param account the account to mint to
    /// @param amount the amount to mint
    function mint(address account, uint amount) external;

    // ----------- Governor only state changing api -----------

    /// @param account the account to incentivize
    /// @param incentive the associated incentive contract
    function setIncentiveContract(address account, address incentive) external;

    // ----------- Getters -----------

    /// @notice get associated incentive contract
    /// @param account the address to check
    /// @return the associated incentive contract, 0 address if N/A
    function incentiveContract(address account) external view returns(address);
}
