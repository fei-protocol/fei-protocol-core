// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SnapshotDelegatorPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICvxLocker {
    function cvxCrv() external view returns (address);
    function cvxcrvStaking() external view returns (address);
    function stakingToken() external view returns (address);
    function balanceOf(address _account) external view returns (uint256);
    function lock(address _account, uint256 _amount, uint256 _spendRatio) external;
    function processExpiredLocks(bool _relock) external;
    function getReward(address _account, bool _stake) external;
}
interface ICrvDepositor {
    function crv() external view returns (address);
    function deposit(uint256 _amount, bool _lock, address _stakeAddress) external;
}
interface ICvxCRVReward {
    function balanceOf(address _user) external view returns (uint256);
    function stake(uint256 _amount) external;
    function withdraw(uint256 amount, bool claim) external;
    function getReward(address _account, bool _claimExtras) external;
}

/// @title Convex Delegator PCV Deposit
/// This contract is designed to be whitelisted as the destination for CVX and CRV
/// rewards earned by various Curve and Convex PCVDeposits.
/// CRV are converted to cvxCRV and staked on Convex. They earn :
///   - CRV rewards, that are cycled back in the same circuit
///   - CVX rewards, that are locked for voting (see following paragraph)
///   - 3crv rewards, that accrue on this contract & should be sent somewhere
///     else, for instance a PCVDeposit that deposit them with FEI in the Curve
///     metapool [3crv, FEI], or a deposit that cash them out for DAI.
/// CVX are vote-locked for 16 weeks, to be able to vote in Convex governance,
/// and earn cvxCRV rewards + eventual bribes. The cvxCRV rewards can be staked
/// to enter the CRV circuit described above (earn CRV/CVX/3crv). The CVX vote
/// for gauge weights happen biweekly through Snapshot (vote.convexfinance.com).
/// @author Fei Protocol
contract ConvexDelegatorPCVDeposit is SnapshotDelegatorPCVDeposit {

    /// @notice the CvxLocker contract to lock CVX tokens on Convex and earn
    /// rewards / be eligible for voting in the Convex governance.
    ICvxLocker public constant cvxLocker = ICvxLocker(address(0xD18140b4B819b895A3dba5442F959fA44994AF50));
    /// @notice the cvxCRV token address.
    IERC20 public immutable cvxCrv = IERC20(cvxLocker.cvxCrv());
    /// @notice the BaseRewardPool contract to stake cvxCRV on Convex.
    ICvxCRVReward public immutable cvxCrvReward = ICvxCRVReward(cvxLocker.cvxcrvStaking());

    /// @notice the CrvDepositor contract to lock CRV tokens on Convex and earn rewards.
    ICrvDepositor public constant crvDepositor = ICrvDepositor(address(0x8014595F2AB54cD7c604B00E9fb932176fDc86Ae));
    /// @notice the CRV token address.
    IERC20 public immutable crv = IERC20(crvDepositor.crv());

    /// @notice Convex Delegator PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _initialDelegate the initial delegate
    constructor(
        address _core,
        address _initialDelegate
    ) SnapshotDelegatorPCVDeposit(
        _core,
        IERC20(cvxLocker.stakingToken()), // CVX token
        bytes32(0x6376782e65746800000000000000000000000000000000000000000000000000), // cvx.eth
        _initialDelegate
    ) {}

    /// @notice returns total balance of CVX staked and on the contract
    function balance() public view override returns (uint256) {
        // should be 0 most of the time, but not if paused & not migrated, or
        // if rewards have been claimed but not re-staked.
        uint256 contractBalance = token.balanceOf(address(this));
        // most CVX should be staked in the cvxLocker
        uint256 stakedBalance = cvxLocker.balanceOf(address(this));

        return contractBalance + stakedBalance;
    }

    /// @notice permissionless call to lock CVX tokens. If a migration is planned,
    /// this contract should be paused. Then, the lock function won't be able to
    /// be called, and the lock will expire after up to 16 weeks.
    /// @dev locked CVX will earn cvxCRV rewards
    function lockCvx() public whenNotPaused {
        uint256 amount = token.balanceOf(address(this));
        token.approve(address(cvxLocker), amount);
        cvxLocker.lock(address(this), amount, 10000); // 100% lock
    }

    /// @notice After the CVX lock of 16 weeks is over, use this function to
    /// burn vlCVX held by this contract, and recover CVX.
    function unlockCvx() external onlyPCVController {
        cvxLocker.processExpiredLocks(false); // do not renew lock
    }

    /// @notice permissionless call to convert CRV tokens to cvxCRV. If a migration
    /// is planned, this contract should be paused. Then, unstakeCvxCrv() can be
    /// called to make cvxCRV tokens available on this contract. Secondary markets
    /// may exist to sell back cvxCRV for pure CRV, but they are not used here.
    function convertAndStakeCrv() public whenNotPaused {
        uint256 amount = crv.balanceOf(address(this));
        crv.approve(address(crvDepositor), amount);
        crvDepositor.deposit(amount, true, address(cvxCrvReward));
    }

    /// @notice stake cvxCRV held on this contract on Convex, to earn multiple
    /// rewards (CRV/CVX/3crv).
    function stakeCvxCrv() external whenNotPaused {
        uint256 amount = cvxCrv.balanceOf(address(this));
        cvxCrv.approve(address(crvDepositor), amount);
        cvxCrvReward.stake(amount);
    }

    /// @notice Unstake cvxCRV from Convex, to make them available on this
    /// contract.
    function unstakeCvxCrv() external onlyPCVController {
        uint256 amount = cvxCrvReward.balanceOf(address(this));
        cvxCrvReward.withdraw(amount, false);
    }

    /// @notice Claim rewards associated to cvxCRV staking (CRV/CVX/3crv).
    function claimCvxCrvRewards(bool claimExtras) public whenNotPaused {
        cvxCrvReward.getReward(address(this), claimExtras);
    }

    /// @notice Claim rewards associated to CVX vote-locking (cvxCRV).
    function claimCvxRewards(bool stake) public whenNotPaused {
        cvxLocker.getReward(address(this), stake);
    }

    /// @notice Claim all rewards and perform routine operations to compound
    /// them into more rewards.
    function claimRewards() public whenNotPaused {
        claimCvxRewards(true); // get cvxCRV and stake
        claimCvxCrvRewards(true); // get CVX/CRV/veCRV
        convertAndStakeCrv(); // convert CRV to cvxCRV and stake
        lockCvx(); // lock CVX for voting
    }
}
