// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./../refs/CoreRef.sol";
import "./IRewarder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @notice migration functionality has been removed as this is only going to be used to distribute staking rewards

/// @notice The idea for this TribalChief contract is to be the owner of tribe token
/// that is deposited into this contract.
/// @notice This contract was forked from sushiswap and has been modified to distribute staking rewards in tribe.
/// All legacy code that relied on MasterChef V1 has been removed so that this contract will pay out staking rewards in tribe.
/// The assumption this code makes is that this MasterChief contract will be funded before going live and offering staking rewards.
/// This contract will not have the ability to mint tribe.
contract TribalChief is CoreRef, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for uint128;
    using SafeCast for int256;

    /// @notice Info of each users's reward debt and virtual amount
    /// stored in a single pool
    struct UserInfo {
        int128 rewardDebt;
        uint128 virtualAmount;
    }

    /// @notice Info for a deposit
    /// `amount` amount of tokens the user has provided.
    /// `virtualAmount` The virtual amount deposited. Calculated like so (multiplier * amount) / scale_factor
    /// assumption here is that we will never go over 2^128 -1
    /// on any user deposits
    struct DepositInfo {
        uint128 amount;
        uint64 unlockBlock;
        uint64 multiplier;
    }

    /// @notice Info of each pool.
    /// `allocPoint` The amount of allocation points assigned to the pool.
    /// Also known as the amount of Tribe to distribute per block.
    struct PoolInfo {
        uint128 accTribePerShare;
        uint128 virtualTotalSupply;
        uint64 lastRewardBlock;
        uint64 allocPoint;
        bool unlocked; // this will allow an admin to unlock the pool if need be.
        // Defaults to false so that users have to respect the lockup period
    }

    /// @notice Info of each pool rewards multipliers available.
    /// map a pool id to a block lock time to a rewards multiplier
    mapping (uint256 => mapping (uint64 => uint64)) public rewardMultipliers;

    /// @notice Data needed for governor to create a new lockup period
    /// and associated reward multiplier
    struct RewardData {
        uint64 lockLength;
        uint64 rewardMultiplier;
    }

    /// @notice Address of Tribe contract.
    IERC20 public immutable TRIBE;

    /// @notice Info of each pool.
    PoolInfo[] public poolInfo;
    /// @notice Address of the token for each pool.
    IERC20[] public stakedToken;
    /// @notice Address of each `IRewarder` contract.
    IRewarder[] public rewarder;
    
    /// @notice Info of each users reward debt and virtual amount.
    /// One object is instantiated per user per pool
    mapping (uint256 => mapping(address => UserInfo)) public userInfo;
    /// @notice Info of each user that stakes tokens.
    mapping (uint256 => mapping (address => DepositInfo[])) public depositInfo;
    /// @dev Total allocation points. Must be the sum of all allocation points in all pools.
    uint128 public totalAllocPoint;

    /// the amount of tribe distributed per block
    uint256 private tribalChiefTribePerBlock = 1e20;
    /// variable has been made immutable to cut down on gas costs
    uint256 private immutable ACC_TRIBE_PRECISION = 1e12;
    /// exponent for rewards multiplier
    uint256 public immutable SCALE_FACTOR = 1e18;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 indexed depositID);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event LogPoolAddition(uint256 indexed pid, uint256 allocPoint, IERC20 indexed stakedToken, IRewarder indexed rewarder);
    event LogSetPool(uint256 indexed pid, uint256 allocPoint, IRewarder indexed rewarder, bool overwrite);
    event LogPoolMultiplier(uint256 indexed pid, uint64 indexed lockLength, uint256 indexed multiplier);
    event LogUpdatePool(uint256 indexed pid, uint64 lastRewardBlock, uint256 lpSupply, uint256 accTribePerShare);
    /// @notice tribe withdraw event
    event TribeWithdraw(uint256 amount);
    event NewTribePerBlock(uint256 indexed amount);
    event PoolLocked(bool indexed locked);

    /// @param _core The Core contract address.
    /// @param _tribe The TRIBE token contract address.
    constructor(address _core, IERC20 _tribe) CoreRef(_core) {
        TRIBE = _tribe;
        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));
    }

    /// @notice Allows governor to change the amount of tribe per block
    /// @param newBlockReward The new amount of tribe per block to distribute
    function updateBlockReward(uint256 newBlockReward) external onlyGovernorOrAdmin {
        if (isContractAdmin(msg.sender)) {
            require(newBlockReward < tribalChiefTribePerBlock, "TribalChief: admin can only lower reward rate");
        }

        tribalChiefTribePerBlock = newBlockReward;
        emit NewTribePerBlock(newBlockReward);
    }

    /// @notice locks the pool so the users cannot withdraw until they have 
    /// locked for the lockup period
    /// @param _pid pool ID
    function lockPool(uint256 _pid) external onlyGovernorOrAdmin {
        PoolInfo storage pool = poolInfo[_pid];
        pool.unlocked = false;

        emit PoolLocked(true);
    }

    /// @notice unlocks the pool so that users can withdraw before their tokens
    /// have been locked for the entire lockup period
    /// @param _pid pool ID
    function unlockPool(uint256 _pid) external onlyGovernorOrAdmin {
        PoolInfo storage pool = poolInfo[_pid];
        pool.unlocked = true;

        emit PoolLocked(false);
    }

    /// @notice changes the pool multiplier
    /// have been locked for the entire lockup period
    /// @param _pid pool ID
    /// @param lockLength lock length to change
    /// @param newRewardsMultiplier updated rewards multiplier
    function governorAddPoolMultiplier(
        uint256 _pid,
        uint64 lockLength, 
        uint64 newRewardsMultiplier
    ) external onlyGovernorOrAdmin {
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

    /// @notice Returns the number of pools.
    function numPools() public view returns (uint256 pools) {
        pools = poolInfo.length;
    }

    /// @notice Returns the number of user deposits in a single pool.
    function openUserDeposits(uint256 pid, address user) public view returns (uint256) {
        return depositInfo[pid][user].length;
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
        // cast uint256 to int256
        int256 b = a.toInt256();
        // cast down from int256 to int128
        int128 c = b.toInt128();
        return c;
    }

    function signed128ToUint256(int128 a) internal pure returns (uint256 c) {
        int256 b = int256(a);
        c = uint256(b);
    }

    /// @notice Add a new token to the pool. Can only be called by the owner.
    /// @param allocPoint AP of the new pool.
    /// @param _stakedToken Address of the ERC-20 token to stake.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param rewardData Reward Multiplier data 
    function add(
        uint128 allocPoint,
        IERC20 _stakedToken,
        IRewarder _rewarder,
        RewardData[] calldata rewardData
    ) external onlyGovernorOrAdmin {
        uint256 lastRewardBlock = block.number;
        totalAllocPoint += allocPoint;
        stakedToken.push(_stakedToken);
        rewarder.push(_rewarder);

        uint256 pid = poolInfo.length;

        require(rewardData.length != 0, "must specify rewards");
        // loop over all of the arrays of lock data and add them to the rewardMultipliers mapping
        for (uint256 i = 0; i < rewardData.length; i++) {
            // if locklength is 0 and multiplier is not equal to scale factor, revert
            if (rewardData[i].lockLength == 0) {
                require(rewardData[i].rewardMultiplier == SCALE_FACTOR, "invalid multiplier for 0 lock length");
            } else {
                // else, assert that multplier is greater than or equal to scale factor
                require(rewardData[i].rewardMultiplier >= SCALE_FACTOR, "invalid multiplier, must be above scale factor");
            }

            rewardMultipliers[pid][rewardData[i].lockLength] = rewardData[i].rewardMultiplier;
            emit LogPoolMultiplier(
                pid,
                rewardData[i].lockLength,
                rewardData[i].rewardMultiplier
            );
        }

        poolInfo.push(PoolInfo({
            allocPoint: allocPoint.toUint64(),
            virtualTotalSupply: 0, // virtual total supply starts at 0 as there is 0 initial supply
            lastRewardBlock: lastRewardBlock.toUint64(),
            accTribePerShare: 0,
            unlocked: false
        }));
        emit LogPoolAddition(pid, allocPoint, _stakedToken, _rewarder);
    }

    /// @notice Update the given pool's TRIBE allocation point and `IRewarder` contract. Can only be called by the owner.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _allocPoint New AP of the pool.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param overwrite True if _rewarder should be `set`. Otherwise `_rewarder` is ignored.
    function set(uint256 _pid, uint128 _allocPoint, IRewarder _rewarder, bool overwrite) public onlyGovernorOrAdmin {
        totalAllocPoint = (totalAllocPoint - poolInfo[_pid].allocPoint) + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint.toUint64();

        if (overwrite) {
            rewarder[_pid] = _rewarder;
        }

        emit LogSetPool(_pid, _allocPoint, overwrite ? _rewarder : rewarder[_pid], overwrite);
    }

    /// @notice Reset the given pool's TRIBE allocation to 0 and unlock the pool. Can only be called by the governor or guardian.
    /// @param _pid The index of the pool. See `poolInfo`.    
    function resetRewards(uint256 _pid) public onlyGuardianOrGovernor {
        // set the pool's allocation points to zero
        totalAllocPoint = (totalAllocPoint - poolInfo[_pid].allocPoint);
        poolInfo[_pid].allocPoint = 0;
        
        // unlock all staked tokens in the pool
        poolInfo[_pid].unlocked = true;

        // erase any IRewarder mapping
        rewarder[_pid] = IRewarder(address(0));
    }

    function _getPendingRewards(uint256 _pid, address _user) private view returns (uint256) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 accTribePerShare = pool.accTribePerShare;

        if (block.number > pool.lastRewardBlock && pool.virtualTotalSupply != 0) {
            uint256 blocks = block.number - pool.lastRewardBlock;
            uint256 tribeReward = (blocks * tribePerBlock() * pool.allocPoint) / totalAllocPoint;
            accTribePerShare = accTribePerShare + ((tribeReward * ACC_TRIBE_PRECISION) / pool.virtualTotalSupply);
        }

        // use the virtual amount to calculate the users share of the pool and their pending rewards
        return signed128ToUint256(
            (toSigned128(user.virtualAmount * accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION)) - int128(user.rewardDebt)
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
        return tribalChiefTribePerBlock;
    }

    /// @notice Update reward variables of the given pool.
    /// @param pid The index of the pool. See `poolInfo`.
    function updatePool(uint256 pid) public {
        PoolInfo storage pool = poolInfo[pid];
        if (block.number > pool.lastRewardBlock) {
            uint256 virtualSupply = pool.virtualTotalSupply;
            if (virtualSupply > 0) {
                uint256 blocks = block.number - pool.lastRewardBlock;
                uint256 tribeReward = (blocks * tribePerBlock() * pool.allocPoint) / totalAllocPoint;
                pool.accTribePerShare = uint128(pool.accTribePerShare + ((tribeReward * ACC_TRIBE_PRECISION) / virtualSupply));
            }
            pool.lastRewardBlock = block.number.toUint64();
            emit LogUpdatePool(pid, pool.lastRewardBlock, virtualSupply, pool.accTribePerShare);
        }
    }

    /// @notice Deposit tokens to earn TRIBE allocation.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount The token amount to deposit.
    /// @param lockLength The length of time you would like to lock tokens
    function deposit(uint256 pid, uint128 amount, uint64 lockLength) public nonReentrant whenNotPaused {
        updatePool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage userPoolData = userInfo[pid][msg.sender];
        DepositInfo memory poolDeposit;

        uint64 multiplier = rewardMultipliers[pid][lockLength];
        require(multiplier >= SCALE_FACTOR, "invalid lock length");

        // Effects
        poolDeposit.amount = amount;
        poolDeposit.unlockBlock = uint64(lockLength + block.number);
        // set the multiplier here so that on withdraw we can easily reset the
        // multiplier and remove the appropriate amount of virtual liquidity
        poolDeposit.multiplier = multiplier;

        // virtual amount is calculated by taking the users total deposited balance and multiplying
        // it by the multiplier then adding it to the aggregated virtual amount
        uint128 virtualAmountDelta = uint128((amount * multiplier) / SCALE_FACTOR);
        userPoolData.virtualAmount += virtualAmountDelta;
        // update reward debt after virtual amount is set by multiplying virtual amount delta by tribe per share
        userPoolData.rewardDebt += int128(virtualAmountDelta * pool.accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION);

        // pool virtual total supply needs to increase here
        pool.virtualTotalSupply += virtualAmountDelta;

        // add the new user struct into storage
        depositInfo[pid][msg.sender].push(poolDeposit);

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, msg.sender, 0, userPoolData.virtualAmount);
        }

        stakedToken[pid].safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, pid, amount, depositInfo[pid][msg.sender].length - 1);
    }

    /// @notice Withdraw staked tokens from pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of the tokens.
    function withdrawAllAndHarvest(uint256 pid, address to) external nonReentrant {
        updatePool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        // gather and pay out users rewards
        _harvest(pid, msg.sender);
        uint128 unlockedTotalAmount = 0;
        uint128 virtualLiquidityDelta = 0;

        // iterate over all deposits this user has.
        // aggregate the deltas
        uint64 processedDeposits = 0;
        for (uint256 i = 0; i < depositInfo[pid][msg.sender].length; i++) {
            DepositInfo storage poolDeposit = depositInfo[pid][msg.sender][i];
            // if the user has locked the tokens for at least the 
            // lockup period or the pool has been unlocked, allow 
            // user to withdraw their principle, otherwise skip this action
            if (poolDeposit.unlockBlock > block.number && pool.unlocked == false) {
                continue;
            }
            // if we get past continue, it means that we are going to process this deposit
            processedDeposits++;

            // gather the virtual and regular amount delta
            unlockedTotalAmount += poolDeposit.amount;
            virtualLiquidityDelta += uint128( (poolDeposit.amount * poolDeposit.multiplier) / SCALE_FACTOR );

            // zero out the user object as their amount will be withdrawn and all pending tribe will be paid out
            poolDeposit.unlockBlock = 0;
            poolDeposit.multiplier = 0;
            poolDeposit.amount = 0;
        }

        // Effects
        if (processedDeposits == depositInfo[pid][msg.sender].length) {
            // remove the array of deposits and userInfo struct if we were able to withdraw from all deposits
            // if we removed all liquidity, then we can just delete all the data we stored on this user
            // in both depositinfo and userinfo, which means that their reward debt, and virtual liquidity
            // are all zero'd.
            delete depositInfo[pid][msg.sender];
            delete userInfo[pid][msg.sender];
        } else {
            // if we didn't end up being able to withdraw all of the liquidity from all of our deposits
            // then we will just update for the amounts that we did remove
            // batched changes are done at the end of the function so that we don't
            // write to these storage slots multiple times
            user.virtualAmount -= virtualLiquidityDelta;
            // set the reward debt to the new virtual amount
            user.rewardDebt = int128(user.virtualAmount * pool.accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION);
        }

        // regardless of whether or not we removed all of this users liquidity from the pool, we will need to
        // subtract the virtual liquidity delta from the pool virtual total supply
        pool.virtualTotalSupply -= virtualLiquidityDelta;

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, user.virtualAmount);
        }

        stakedToken[pid].safeTransfer(to, unlockedTotalAmount);

        emit Withdraw(msg.sender, pid, unlockedTotalAmount, to);
    }

    /// @notice Withdraw tokens from pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount Token amount to withdraw.
    /// @param to Receiver of the tokens.
    function withdrawFromDeposit(
        uint256 pid,
        uint128 amount,
        address to,
        uint256 index
    ) public nonReentrant {
        require(depositInfo[pid][msg.sender].length > index, "invalid index");
        updatePool(pid);
        PoolInfo storage pool = poolInfo[pid];
        DepositInfo storage poolDeposit = depositInfo[pid][msg.sender][index];
        UserInfo storage user = userInfo[pid][msg.sender];

        // if the user has locked the tokens for at least the 
        // lockup period or the pool has been unlocked by the governor,
        // allow user to withdraw their principle
        require(poolDeposit.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

        uint128 virtualAmountDelta = uint128( ( amount * poolDeposit.multiplier ) / SCALE_FACTOR );

        // Effects
        poolDeposit.amount -= amount;
        user.rewardDebt = user.rewardDebt - toSigned128(user.virtualAmount * pool.accTribePerShare) / toSigned128(ACC_TRIBE_PRECISION);
        user.virtualAmount -= virtualAmountDelta;
        pool.virtualTotalSupply -= virtualAmountDelta;

        // Interactions
        stakedToken[pid].safeTransfer(to, amount);

        emit Withdraw(msg.sender, pid, amount, to);
    }

    /// @notice Helper function to harvest users tribe rewards
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of TRIBE rewards.
    function _harvest(uint256 pid, address to) private {
        updatePool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        // assumption here is that we will never go over 2^128 -1
        int256 accumulatedTribe = int256( uint256(user.virtualAmount) * uint256(pool.accTribePerShare) ) / int256(ACC_TRIBE_PRECISION);

        // this should never happen
        require(accumulatedTribe >= 0 || (accumulatedTribe - user.rewardDebt) < 0, "negative accumulated tribe");

        uint256 pendingTribe = uint256(accumulatedTribe - user.rewardDebt);

        // if pending tribe is ever negative, revert as this can cause an underflow when we turn this number to a uint
        require(pendingTribe.toInt256() >= 0, "pendingTribe is less than 0");

        // Effects
        user.rewardDebt = int128(accumulatedTribe);

        // Interactions
        if (pendingTribe != 0) {
            TRIBE.safeTransfer(to, pendingTribe);
        }

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward( pid, msg.sender, to, pendingTribe, user.virtualAmount);
        }

        emit Harvest(msg.sender, pid, pendingTribe);
    }

    /// @notice Harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of TRIBE rewards.
    function harvest(uint256 pid, address to) public nonReentrant {
        _harvest(pid, to);
    }

    //////////////////////////////////////////////////////////////////////////////
    // ----> if you call emergency withdraw, you are forfeiting your rewards <----
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Withdraw without caring about rewards. EMERGENCY ONLY.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of the deposited tokens.
    function emergencyWithdraw(uint256 pid, address to) public nonReentrant {
        updatePool(pid);
        PoolInfo storage pool = poolInfo[pid];

        uint128 totalUnlocked = 0;
        uint128 virtualLiquidityDelta = 0;
        for (uint256 i = 0; i < depositInfo[pid][msg.sender].length; i++) {
            DepositInfo storage poolDeposit = depositInfo[pid][msg.sender][i];

            // if the user has locked the tokens for at least the 
            // lockup period or the pool has been unlocked, allow 
            // user to withdraw their principle
            require(poolDeposit.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

            totalUnlocked += poolDeposit.amount;

            // update the aggregated deposit virtual amount
            // update the virtualTotalSupply
            virtualLiquidityDelta += uint128((poolDeposit.amount * poolDeposit.multiplier) / SCALE_FACTOR);
        }

        // subtract virtualLiquidity Delta from the virtual total supply of this pool
        pool.virtualTotalSupply -= virtualLiquidityDelta;

        // remove the array of deposits and userInfo struct
        delete depositInfo[pid][msg.sender];
        delete userInfo[pid][msg.sender];

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, 0);
        }

        // Note: transfer can fail or succeed if `amount` is zero.
        stakedToken[pid].safeTransfer(to, totalUnlocked);
        emit EmergencyWithdraw(msg.sender, pid, totalUnlocked, to);
    }
}
