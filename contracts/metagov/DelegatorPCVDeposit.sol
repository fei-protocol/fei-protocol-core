// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../pcv/PCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/// @title Delegator PCV Deposit
/// This contract simply holds an ERC20 token, and delegate its voting power
/// to an address. The ERC20 token needs to implement a delegate(address) method.
/// @author Fei Protocol
contract DelegatorPCVDeposit is PCVDeposit {

    event DelegateUpdate(address indexed oldDelegate, address indexed newDelegate);

    /// @notice the token that is being used for voting
    ERC20Votes public immutable token;

    /// @notice the snapshot delegate for the deposit
    address public delegate;

    /// @notice Delegator PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _token snapshot token
    /// @param _initialDelegate the initial delegate
    constructor(
        address _core,
        address _token,
        address _initialDelegate
    ) CoreRef(_core) {
        token = ERC20Votes(_token);
        _delegate(_initialDelegate);

        // Use a shared role to manage meta-governance related actions
        _setContractAdminRole(keccak256("METAGOV_ADMIN_ROLE"));
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
    {
        _withdrawERC20(address(token), to, amountUnderlying);
    }

    /// @notice no-op
    function deposit() external override {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override virtual returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    /// @notice sets the snapshot delegate
    /// @dev callable by governor or admin
    function setDelegate(address newDelegate) external onlyGovernorOrAdmin {
        _delegate(newDelegate);
    }

    function _delegate(address newDelegate) internal {
        address oldDelegate = delegate;
        delegate = newDelegate;

        token.delegate(delegate);

        emit DelegateUpdate(oldDelegate, newDelegate);
    }
}
