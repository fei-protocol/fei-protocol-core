// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./../refs/CoreRef.sol";
import "./IRewardsDistributor.sol";
import "./IRewarder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice migration functionality has been removed as this is only going to be used to distribute staking rewards

/// @notice The idea for this MasterChief V2 (MCV2) contract is therefore to be the owner of tribe token
/// that is deposited into this contract.
/// @notice This contract was forked from sushiswap and has been modified to distribute staking rewards in tribe.
/// All legacy code that relied on MasterChef V1 has been removed so that this contract will pay out staking rewards in tribe.
/// The assumption this code makes is that this MasterChief contract will be funded before going live and offering staking rewards.
/// This contract will not have the ability to mint tribe.
contract MasterChief is CoreRef {
    using SafeERC20 for IERC20;

    /// @notice Info of each users's reward debt and virtual amount
    /// stored in a single pool
    struct UserInfo {
        int128 rewardDebt;
        uint128 virtualAmount;
    }

    /// @notice Info of each MCV2 user.
    /// `amount` LP token amount the user has provided.
    /// `rewardDebt` The amount of Tribe entitled to the user.
    /// assumption here is that we will never go over 2^128 -1
    /// on any user deposits or reward debts
    struct DepositInfo {
        uint128 amount;
        uint64 unlockBlock;
        uint256 multiplier;
    }

    /// @notice Info of each MCV2 pool.
    /// `allocPoint` The amount of allocation points assigned to the pool.
    /// Also known as the amount of Tribe to distribute per block.
    struct PoolInfo {
        uint128 accTribePerShare;
        uint128 virtualPoolTotalSupply;
        uint64 lastRewardBlock;
        uint64 allocPoint;
        bool unlocked; // this will allow an admin to unlock the pool if need be.
        // Defaults to false so that users have to respect the lockup period
    }

    /// @notice Info of each MCV2 pool rewards multipliers available.
    /// map a pool id to a block lock time to a rewards multiplier
    mapping (uint256 => mapping (uint64 => uint256)) public rewardMultipliers;

    struct RewardData {
        uint64 lockLength;
        uint256 rewardMultiplier;
    }

    /// @notice Address of Tribe contract.
    IERC20 public immutable TRIBE;

    /// @notice Info of each MCV2 pool.
    PoolInfo[] public poolInfo;
    /// @notice Address of the LP token for each MCV2 pool.
    IERC20[] public lpToken;
    /// @notice Address of each `IRewarder` contract in MCV2.
    IRewarder[] public rewarder;
    
    mapping (uint256 => mapping(address => UserInfo)) public aggregatedUserDeposits;
    /// @notice Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => DepositInfo[])) public depositInfo;
    /// @dev Total allocation points. Must be the sum of all allocation points in all pools.
    uint128 public totalAllocPoint;

    uint256 private masterChefTribePerBlock = 1e20;
    // variable has been made immutable to cut down on gas costs
    uint256 private immutable ACC_TRIBE_PRECISION = 1e12;
    uint256 public immutable SCALE_FACTOR = 1e18;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 indexed depositID);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event LogPoolAddition(uint256 indexed pid, uint256 allocPoint, IERC20 indexed lpToken, IRewarder indexed rewarder);
    event LogSetPool(uint256 indexed pid, uint256 allocPoint, IRewarder indexed rewarder, bool overwrite);
    event LogPoolMultiplier(uint256 indexed pid, uint64 indexed lockLength, uint256 indexed multiplier);
    event LogUpdatePool(uint256 indexed pid, uint64 lastRewardBlock, uint256 lpSupply, uint256 accTribePerShare);
    event LogInit();
    /// @notice tribe withdraw event
    event TribeWithdraw(uint256 amount);

    /// @param _core The Core contract address.
    /// @param _tribe The TRIBE token contract address.
    constructor(address _core, IERC20 _tribe) CoreRef(_core) {
        TRIBE = _tribe;
    }

    function updateBlockReward(uint256 newBlockReward) external onlyGovernor {
        masterChefTribePerBlock = newBlockReward;
    }

    /// @notice locks the pool so the users cannot withdraw until they have 
    /// locked for the lockup period
    /// @param _pid pool ID
    function lockPool(uint256 _pid) external onlyGovernor {
        PoolInfo storage pool = poolInfo[_pid];
        pool.unlocked = false;
    }

    /// @notice unlocks the pool so that users can withdraw before their tokens
    /// have been locked for the entire lockup period
    /// @param _pid pool ID
    function unlockPool(uint256 _pid) external onlyGovernor {
        PoolInfo storage pool = poolInfo[_pid];
        pool.unlocked = true;
    }

    /// @notice changes the pool multiplier
    /// have been locked for the entire lockup period
    /// @param _pid pool ID
    /// @param lockLength lock length to change
    /// @param newRewardsMultiplier updated rewards multiplier
    function governorAddPoolMultiplier(
        uint256 _pid,
        uint64 lockLength, 
        uint256 newRewardsMultiplier
    ) external onlyGovernor {
        PoolInfo storage pool = poolInfo[_pid];
        uint256 currentMultiplier = rewardMultipliers[_pid][lockLength];
        // if the new multplier is less than the current multiplier,
        // then, you need to unlock the pool to allow users to withdraw
        if (newRewardsMultiplier < currentMultiplier) {
            pool.unlocked = true;
        }
        rewardMultipliers[_pid][lockLength] = newRewardsMultiplier;

        emit LogPoolMultiplier(_pid, lockLength, newRewardsMultiplier);
    }

    /// @notice sends tokens back to governance treasury. Only callable by governance
    /// @param amount the amount of tokens to send back to treasury
    function governorWithdrawTribe(uint256 amount) external onlyGovernor {
        TRIBE.safeTransfer(address(core()), amount);
        emit TribeWithdraw(amount);
    }

    /// @notice Returns the number of MCV2 pools.
    function poolLength() public view returns (uint256 pools) {
        pools = poolInfo.length;
    }

    /// @notice Returns the number of user deposits in a single pool.
    function openUserDeposits(uint256 pid, address user) public view returns (uint256) {
        return depositInfo[pid][user].length;
    }

    /**
     * @dev Returns the downcasted uint64 from uint256, reverting on
     * overflow (when the input is greater than largest uint64).
     *
     * Counterpart to Solidity's `uint64` operator.
     *
     * Requirements:
     *
     * - input must fit into 64 bits
     */
    function toUint64(uint256 value) internal pure returns (uint64) {
        require(value <= type(uint64).max, "SafeCast: value doesn't fit in 64 bits");
        return uint64(value);
    }

    /**
     * @dev Returns the downcasted uint128 from uint256, reverting on
     * overflow (when the input is greater than largest uint128).
     *
     * Counterpart to Solidity's `uint128` operator.
     *
     * Requirements:
     *
     * - input must fit into 128 bits
     */
    function toUint128(uint256 value) internal pure returns (uint128) {
        require(value <= type(uint128).max, "SafeCast: value doesn't fit in 128 bits");
        return uint128(value);
    }

    /**
     * @dev Returns the downcasted int128 from uint256, reverting on
     * overflow (when the input is greater than largest int128).
     *
     * Counterpart to Solidity's `int128` operator.
     *
     * Requirements:
     *
     * - input must fit into 128 bits
     */
    function toSigned128(uint256 a) internal pure returns (int128) {
        require(int256(a) <= type(int128).max, "SafeCast: value doesn't fit in 128 bits");
        return int128(uint128(a));
    }

    function signed128ToUint256(int128 a) internal pure returns (uint256 c) {
        int256 b = int256(a);
        c = uint256(b);
    }

    /// @notice Add a new LP to the pool. Can only be called by the owner.
    /// DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    /// @param allocPoint AP of the new pool.
    /// @param _lpToken Address of the LP ERC-20 token.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param rewardData Reward Multiplier data 
    function add(
        uint128 allocPoint,
        IERC20 _lpToken,
        IRewarder _rewarder,
        RewardData[] calldata rewardData
    ) external onlyGovernor {
        uint256 lastRewardBlock = block.number;
        totalAllocPoint += allocPoint;
        lpToken.push(_lpToken);
        rewarder.push(_rewarder);

        uint256 pid = poolInfo.length;

        require(rewardData.length != 0, "must specify rewards");
        // loop over all of the arrays of lock data and add them to the rewardMultipliers mapping
        for (uint256 i = 0; i < rewardData.length; i++) {
            // if locklength is 0 and multiplier is not equal to scale factor, revert
            if (rewardData[i].lockLength == 0) {
                require(rewardData[i].rewardMultiplier == SCALE_FACTOR, "invalid multiplier for 0 lock length");
            }
            require(rewardData[i].rewardMultiplier >= SCALE_FACTOR, "invalid multiplier, must be above scale factor");

            rewardMultipliers[pid][rewardData[i].lockLength] = rewardData[i].rewardMultiplier;
            emit LogPoolMultiplier(
                pid,
                rewardData[i].lockLength,
                rewardData[i].rewardMultiplier
            );
        }

        poolInfo.push(PoolInfo({
            allocPoint: toUint64(allocPoint),
            virtualPoolTotalSupply: 0, // virtual total supply starts at 0 as there is 0 initial supply
            lastRewardBlock: toUint64(lastRewardBlock),
            accTribePerShare: 0,
            unlocked: false
        }));
        emit LogPoolAddition(pid, allocPoint, _lpToken, _rewarder);
    }

    /// @notice Update the given pool's TRIBE allocation point and `IRewarder` contract. Can only be called by the owner.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _allocPoint New AP of the pool.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param overwrite True if _rewarder should be `set`. Otherwise `_rewarder` is ignored.
    function set(uint256 _pid, uint128 _allocPoint, IRewarder _rewarder, bool overwrite) public onlyGovernor {
        totalAllocPoint = (totalAllocPoint - poolInfo[_pid].allocPoint) + _allocPoint;
        poolInfo[_pid].allocPoint = toUint64(_allocPoint);

        if (overwrite) {
            rewarder[_pid] = _rewarder;
        }

        emit LogSetPool(_pid, _allocPoint, overwrite ? _rewarder : rewarder[_pid], overwrite);
    }

    function _getPendingRewards(uint256 _pid, address _user) private view returns (uint256) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage aggregatedDeposits = aggregatedUserDeposits[_pid][_user];

        uint256 accTribePerShare = pool.accTribePerShare;

        if (block.number > pool.lastRewardBlock && pool.virtualPoolTotalSupply != 0) {
            uint256 blocks = block.number - pool.lastRewardBlock;
            uint256 tribeReward = (blocks * tribePerBlock() * pool.allocPoint) / totalAllocPoint;
            accTribePerShare = accTribePerShare + ((tribeReward * ACC_TRIBE_PRECISION) / pool.virtualPoolTotalSupply);
        }

        // use the virtual amount to calculate the users share of the pool and their pending rewards
        return signed128ToUint256(
            (toSigned128((aggregatedDeposits.virtualAmount) * accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION)) - int128(aggregatedDeposits.rewardDebt)
        );
    }

    /// @notice View function to see all pending TRIBE on frontend.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _user Address of user.
    /// @return pending TRIBE reward for a given user.
    function allPendingRewards(uint256 _pid, address _user) external view returns (uint256) {
        return _getPendingRewards(_pid, _user);
    }

    /// @notice Update reward variables for all pools. Be careful of gas spending!
    /// @param pids Pool IDs of all to be updated. Make sure to update all active pools.
    function massUpdatePools(uint256[] calldata pids) external {
        uint256 len = pids.length;
        for (uint256 i = 0; i < len; ++i) {
            updatePool(pids[i]);
        }
    }

    /// @notice Calculates and returns the `amount` of TRIBE per block.
    function tribePerBlock() public view returns (uint256) {
        return masterChefTribePerBlock;
    }

    /// @notice Update reward variables of the given pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @return pool Returns the pool that was updated.
    function updatePool(uint256 pid) public returns (PoolInfo memory pool) {
        pool = poolInfo[pid];
        if (block.number > pool.lastRewardBlock) {
            uint256 virtualSupply = pool.virtualPoolTotalSupply;
            if (virtualSupply > 0) {
                uint256 blocks = block.number - pool.lastRewardBlock;
                uint256 tribeReward = (blocks * tribePerBlock() * pool.allocPoint) / totalAllocPoint;
                pool.accTribePerShare = uint128(pool.accTribePerShare + ((tribeReward * ACC_TRIBE_PRECISION) / virtualSupply));
            }
            pool.lastRewardBlock = toUint64(block.number);
            poolInfo[pid] = pool;
            emit LogUpdatePool(pid, pool.lastRewardBlock, virtualSupply, pool.accTribePerShare);
        }
    }

    /// @notice Deposit LP tokens to MCV2 for TRIBE allocation.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount LP token amount to deposit.
    /// @param lockLength The length of time you would like to lock tokens
    /// if locking is not enforced, this value can be 0. If locking is enforced,
    /// a user must pass a valid 
    /// @dev you can only deposit on a single deposit id once.
    function deposit(uint256 pid, uint128 amount, uint64 lockLength) public {
        PoolInfo memory pool = updatePool(pid);
        PoolInfo storage poolPointer = poolInfo[pid];
        UserInfo storage aggregatedDeposits = aggregatedUserDeposits[pid][msg.sender];
        DepositInfo memory user;

        // Effects
        user.amount = amount;

        uint256 multiplier;
        // if lock length is not 0, then we will validate that the locklength is correct
        if (lockLength != 0) {
            user.unlockBlock = uint64(lockLength + block.number);
        }

        multiplier = rewardMultipliers[pid][lockLength];
        require(multiplier >= SCALE_FACTOR, "invalid multiplier");

        // set the multiplier here so that on withdraw we can easily reset the
        // multiplier and remove the appropriate amount of virtual liquidity
        user.multiplier = multiplier;

        // virtual amount is calculated by taking the users total deposited balance and multiplying
        // it by the multiplier then adding it to the aggregated virtual amount
        uint128 virtualAmountDelta = uint128((amount * multiplier) / SCALE_FACTOR);
        aggregatedDeposits.virtualAmount += virtualAmountDelta;

        // pool virtual total supply needs to increase here
        poolPointer.virtualPoolTotalSupply += virtualAmountDelta;

        // update reward debt after virtual amount is set
        aggregatedDeposits.rewardDebt += int128(aggregatedDeposits.virtualAmount * pool.accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION);

        depositInfo[pid][msg.sender].push(user);
        uint256 depositID = depositInfo[pid][msg.sender].length - 1;

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, msg.sender, 0, user.amount);
        }

        lpToken[pid].safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, pid, amount, depositID);
    }

    /// @notice Withdraw LP tokens from MCV2.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of the LP tokens.
    function withdrawAllAndHarvest(uint256 pid, address to) external {
        PoolInfo memory pool = updatePool(pid);
        PoolInfo storage poolPointer = poolInfo[pid];
        UserInfo storage aggregatedDeposits = aggregatedUserDeposits[pid][msg.sender];

        uint128 lockedTotalAmount = 0;
        uint256 rewardTotalAmount = _getPendingRewards(pid, msg.sender);
        uint128 virtualLiquidityDelta = 0;

        // iterate over all deposits this user has.
        for (uint256 i = 0; i < depositInfo[pid][msg.sender].length; i++) {
            DepositInfo storage user = depositInfo[pid][msg.sender][i];
            // if the user has locked the tokens for at least the 
            // lockup period or the pool has been unlocked, allow 
            // user to withdraw their principle, otherwise skip this action
            if (user.unlockBlock > block.number && pool.unlocked == false) {
                continue;
            }

            // gather the virtual amount delta
            uint128 delta = uint128( (user.amount * user.multiplier) / SCALE_FACTOR );
            lockedTotalAmount += user.amount;
            virtualLiquidityDelta += delta;

            // zero out the user object as their amount will be withdrawn and all pending tribe will be paid out
            user.unlockBlock = 0;
            user.multiplier = 0;
            user.amount = 0;
        }

        // Effects
        // batched changes are done at the end of the function so that we don't
        // write to these storage slots multiple times
        aggregatedDeposits.virtualAmount -= virtualLiquidityDelta;
        aggregatedDeposits.rewardDebt = aggregatedDeposits.rewardDebt - int128(uint128((aggregatedDeposits.virtualAmount * pool.accTribePerShare) / toUint128(ACC_TRIBE_PRECISION)));
        poolPointer.virtualPoolTotalSupply -= virtualLiquidityDelta;

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, lockedTotalAmount);
        }

        lpToken[pid].safeTransfer(to, lockedTotalAmount);
        TRIBE.safeTransfer(to, rewardTotalAmount);

        emit Harvest(msg.sender, pid, rewardTotalAmount);
        emit Withdraw(msg.sender, pid, lockedTotalAmount, to);
    }

    /// @notice Withdraw LP tokens from MCV2.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount LP token amount to withdraw.
    /// @param to Receiver of the LP tokens.
    function withdrawFromDeposit(
        uint256 pid,
        uint128 amount,
        address to,
        uint256 index
    ) public {
        require(depositInfo[pid][msg.sender].length > index, "invalid index");
        PoolInfo memory pool = updatePool(pid);
        PoolInfo storage poolPointer = poolInfo[pid];
        DepositInfo storage user = depositInfo[pid][msg.sender][index];
        UserInfo storage aggregatedDeposits = aggregatedUserDeposits[pid][msg.sender];

        // if the user has locked the tokens for at least the 
        // lockup period or the pool has been unlocked, allow 
        // user to withdraw their principle
        require(user.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

        uint128 virtualAmountDelta = uint128( ( amount * user.multiplier ) / SCALE_FACTOR );

        // Effects
        user.amount -= amount;
        aggregatedDeposits.rewardDebt = aggregatedDeposits.rewardDebt - toSigned128(aggregatedDeposits.virtualAmount * pool.accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION);
        aggregatedDeposits.virtualAmount -= virtualAmountDelta;
        poolPointer.virtualPoolTotalSupply -= virtualAmountDelta;

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, user.amount);
        }
        
        lpToken[pid].safeTransfer(to, amount);

        emit Withdraw(msg.sender, pid, amount, to);
    }

    /// @notice Harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of TRIBE rewards.
    function harvest(uint256 pid, address to) public {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = aggregatedUserDeposits[pid][msg.sender];

        // assumption here is that we will never go over 2^128 -1
        int256 accumulatedTribe = int256( uint256(user.virtualAmount) * uint256(pool.accTribePerShare) ) / int256(ACC_TRIBE_PRECISION);
        // this should never happen
        require(accumulatedTribe >= 0 || (accumulatedTribe - user.rewardDebt) < 0, "negative accumulated tribe");

        uint256 pendingTribe = uint256(accumulatedTribe - user.rewardDebt);

        // Effects
        user.rewardDebt = int128(accumulatedTribe);

        // Interactions
        if (pendingTribe != 0) {
            TRIBE.safeTransfer(to, pendingTribe);
        }

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {

            /// question mark here on whether we want to use the amount or the virtual amount

            _rewarder.onSushiReward( pid, msg.sender, to, pendingTribe, user.virtualAmount);
        }

        emit Harvest(msg.sender, pid, pendingTribe);
    }

    /// @notice Withdraw without caring about rewards. EMERGENCY ONLY.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of the LP tokens.
    /// @param index array index of the deposit to withdraw
    function emergencyWithdraw(uint256 pid, address to, uint256 index) public {
        require(depositInfo[pid][msg.sender].length > index, "invalid index");

        PoolInfo memory pool = updatePool(pid);
        DepositInfo storage user = depositInfo[pid][msg.sender][index];
        UserInfo storage aggregatedDeposit = aggregatedUserDeposits[pid][msg.sender];

        // if the user has locked the tokens for at least the 
        // lockup period or the pool has been unlocked, allow 
        // user to withdraw their principle
        require(user.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

        uint256 amount = user.amount;

        aggregatedDeposit.virtualAmount -= uint128((amount * user.multiplier) / SCALE_FACTOR);

        user.amount = 0;
        user.multiplier = 0;
        user.unlockBlock = 0;

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, 0);
        }

        // Note: transfer can fail or succeed if `amount` is zero.
        lpToken[pid].safeTransfer(to, amount);
        emit EmergencyWithdraw(msg.sender, pid, amount, to);
    }
}
