// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

/// @title Yield Bearing Vault
/// @author joeysantoro, Transmissions11 and JetJadeja
abstract contract IYieldVault {

    /*///////////////////////////////////////////////////////////////
                                IMMUTABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The underlying token the Vault accepts.
    address public underlying;

    uint256 public baseUnit;

    uint256 public totalSupply;

    /// @notice Deposit a specific amount of underlying tokens.
    /// @param to The address to receive shares corresponding to the deposit
    /// @param underlyingAmount The amount of the underlying token to deposit.
    function deposit(address to, uint256 underlyingAmount) public virtual returns (uint256 shares);

    /// @notice Withdraw a specific amount of underlying tokens.
    /// @param to The address to receive underlying tokens corresponding to the withdrawal.
    /// @param underlyingAmount The amount of underlying tokens to withdraw.
    function withdraw(address to, uint256 underlyingAmount) public virtual returns (uint256 shares);

    /*///////////////////////////////////////////////////////////////
                        VAULT ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns a user's Vault balance in underlying tokens.
    /// @param user The user to get the underlying balance of.
    /// @return The user's Vault balance in underlying tokens.
    function balanceOfUnderlying(address user) external view virtual returns (uint256);

    /// @notice Returns the amount of underlying tokens an share can be redeemed for.
    /// @return The amount of underlying tokens an share can be redeemed for.
    function exchangeRate() public view virtual returns (uint256);

    /// @notice Calculates the total amount of underlying tokens the Vault holds.
    /// @return totalUnderlyingHeld The total amount of underlying tokens the Vault holds.
    function totalHoldings() public view virtual returns (uint256);
}