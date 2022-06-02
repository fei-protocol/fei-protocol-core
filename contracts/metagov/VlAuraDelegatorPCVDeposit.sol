// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../core/TribeRoles.sol";
import "./DelegatorPCVDeposit.sol";

interface IAuraLocker {
    struct LockedBalance {
        uint112 amount;
        uint32 unlockTime;
    }
    struct EarnedData {
        address token;
        uint256 amount;
    }

    function lock(address _account, uint256 _amount) external;

    function getReward(address _account, bool _stake) external;

    function processExpiredLocks(bool _relock) external;

    function emergencyWithdraw() external;

    function delegates(address account) external view returns (address);

    function getVotes(address account) external view returns (uint256);

    function lockedBalances(address _user)
        external
        view
        returns (
            uint256 total,
            uint256 unlockable,
            uint256 locked,
            LockedBalance[] memory lockData
        );

    function claimableRewards(address _account) external view returns (EarnedData[] memory userRewards);

    function notifyRewardAmount(address _rewardsToken, uint256 _reward) external;
}

interface IAuraMerkleDrop {
    function claim(
        bytes32[] calldata _proof,
        uint256 _amount,
        bool _lock
    ) external returns (bool);
}

/// @title Vote-locked AURA PCVDeposit
/// @author eswak
contract VlAuraDelegatorPCVDeposit is DelegatorPCVDeposit {
    using SafeERC20 for IERC20;

    address private constant AURA_TOKEN = 0x0000000000000000000000000000000000000000;
    address private constant VLAURA_TOKEN = 0x0000000000000000000000000000000000000000;
    address private constant AURA_AIRDROP = 0x0000000000000000000000000000000000000000;

    /// @notice constructor
    /// @param _core Fei Core for reference
    /// @param _initialDelegate the initial delegate
    constructor(address _core, address _initialDelegate) DelegatorPCVDeposit(_core, VLAURA_TOKEN, _initialDelegate) {}

    /// @notice noop, vlAURA can't be transferred.
    /// wait for lock expiry, and call withdrawERC20 on AURA.
    function withdraw(address, uint256) external override {}

    /// @notice returns the balance of locked + unlocked
    function balance() public view virtual override returns (uint256) {
        return IERC20(AURA_TOKEN).balanceOf(address(this)) + IERC20(VLAURA_TOKEN).balanceOf(address(this));
    }

    /// @notice claim AURA airdrop and vote-lock it for 16 weeks
    /// this function is not access controlled & can be called by anyone.
    function claimAirdropAndLock(bytes32[] calldata _proof, uint256 _amount) external returns (bool) {
        return IAuraMerkleDrop(AURA_AIRDROP).claim(_proof, _amount, true);
    }

    /// @notice lock AURA held on this contract to vlAURA
    function lock() external whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        uint256 amount = IERC20(AURA_TOKEN).balanceOf(address(this));
        IERC20(AURA_TOKEN).safeApprove(VLAURA_TOKEN, amount);
        IAuraLocker(VLAURA_TOKEN).lock(address(this), amount);
    }

    /// @notice refresh lock after it has expired
    function relock() external whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        IAuraLocker(VLAURA_TOKEN).processExpiredLocks(true);
    }

    /// @notice exit lock after it has expired
    function unlock() external whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        IAuraLocker(VLAURA_TOKEN).processExpiredLocks(false);
    }

    /// @notice emergency withdraw if system is shut down
    function emergencyWithdraw() external whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        IAuraLocker(VLAURA_TOKEN).emergencyWithdraw();
    }

    /// @notice get rewards & stake them (rewards claiming is permissionless)
    function getReward() external {
        IAuraLocker(VLAURA_TOKEN).getReward(address(this), true);
    }

    /// @notice governor-protected function to call another contract.
    /// as this contract manages a locked position as is immutable,
    /// this function is added to make sure no funds are ever locked,
    /// and that the voting power from locking tokens can always be used
    /// even if the external smart contracts change.
    function call(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyGovernor {
        // solhint-disable-next-line
        (bool success, ) = target.call{value: value}(data);
        require(success, "call failed");
    }
}
