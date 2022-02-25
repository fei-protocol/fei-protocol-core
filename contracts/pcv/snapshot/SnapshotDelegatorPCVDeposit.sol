// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../PCVDeposit.sol";

interface DelegateRegistry {
    function setDelegate(bytes32 id, address delegate) external;

    function clearDelegate(bytes32 id) external;

    function delegation(address delegator, bytes32 id)
        external
        view
        returns (address delegatee);
}

/// @title Snapshot Delegator PCV Deposit
/// @author Fei Protocol
contract SnapshotDelegatorPCVDeposit is PCVDeposit {
    event DelegateUpdate(
        address indexed oldDelegate,
        address indexed newDelegate
    );

    /// @notice the Gnosis delegate registry used by snapshot
    DelegateRegistry public constant DELEGATE_REGISTRY =
        DelegateRegistry(0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446);

    /// @notice the token that is being used for snapshot
    IERC20 public immutable token;

    /// @notice the keccak encoded spaceId of the snapshot space
    bytes32 public spaceId;

    /// @notice the snapshot delegate for the deposit
    address public delegate;

    /// @notice Snapshot Delegator PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _token snapshot token
    /// @param _spaceId the id (or ENS name) of the snapshot space
    constructor(
        address _core,
        IERC20 _token,
        bytes32 _spaceId,
        address _initialDelegate
    ) CoreRef(_core) {
        token = _token;
        spaceId = _spaceId;
        _delegate(_initialDelegate);
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
    function balance() public view override returns (uint256) {
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

    /// @notice clears the delegate from snapshot
    /// @dev callable by governor or guardian
    function clearDelegate() external onlyGuardianOrGovernor {
        address oldDelegate = delegate;
        DELEGATE_REGISTRY.clearDelegate(spaceId);

        emit DelegateUpdate(oldDelegate, address(0));
    }

    function _delegate(address newDelegate) internal {
        address oldDelegate = delegate;
        DELEGATE_REGISTRY.setDelegate(spaceId, newDelegate);
        delegate = newDelegate;

        emit DelegateUpdate(oldDelegate, newDelegate);
    }
}
