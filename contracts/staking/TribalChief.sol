// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./../refs/CoreRef.sol";
import "./IRewarder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @notice migration functionality has been removed as this is only going to be used to distribute staking rewards

/// @notice The idea for this TribalChief contract is to be the owner of tribe token
/// that is deposited into this contract.
/// @notice This contract was forked from sushiswap and has been modified to distribute staking rewards in tribe.
/// All legacy code that relied on MasterChef V1 has been removed so that this contract will pay out staking rewards in tribe.
/// The assumption this code makes is that this MasterChief contract will be funded before going live and offering staking rewards.
/// This contract will not have the ability to mint tribe.
contract TribalChief is CoreRef, ReentrancyGuard, Initializable {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for int256;

    /// @notice Info of each users's reward debt and virtual amount
    /// stored in a single pool
    /// `virtualAmount` The virtual amount deposited. Calculated like so (multiplier * amount) / scale_factor
    /// assumption here is that we will never go over 2^256 -1
    /// on any user deposits
    /// 'rewardDebt' tracks the tribe per share when the user entered the pool
    /// and is used to determine how much Tribe rewards a user is entitled to
    struct UserInfo {
        int256 rewardDebt;
        uint256 virtualAmount;
    }

    /// @notice Info for a deposit
    /// `amount` amount of tokens the user has provided.
    /// assumption here is that we will never go over 2^256 -1
    /// on any user deposits
    /// `unlockBlock` is when a users lockup period ends and they are free to withdraw
    /// `multiplier` is the multiplier users received on their locked amount.
    /// This is used to calculate virtual liquidity deltas.
    struct DepositInfo {
        uint256 amount;
        uint128 unlockBlock;
        uint128 multiplier;
    }

    /// @notice Info of each pool.
    /// `virtualTotalSupply` The total virtual supply in this pool
    /// `accTribePerShare` The amount of tribe each share is entitled to.
    /// Users entering a pool have their reward debt start at current tribe per share and
    /// then they get the delta between where the tribe per share goes to and where they started.
    /// `lastRewardBlock` The last block where rewards were paid for this pool
    /// `allocPoint` The amount of allocation points assigned to the pool.
    /// Also known as the amount of Tribe to distribute per block.
    /// `unlocked` Whether or not the pool has been unlocked by an admin
    /// this will allow an admin to unlock the pool if need be.
    /// This value defaults to false so that users have to respect the lockup period.
    struct PoolInfo {
        uint256 virtualTotalSupply;
        uint256 accTribePerShare;
        uint128 lastRewardBlock;
        uint120 allocPoint;
        bool unlocked;
    }

    /// @notice Info of each pool rewards multipliers available.
    /// map a pool id to a block lock time to a rewards multiplier
    mapping(uint256 => mapping(uint128 => uint128)) public rewardMultipliers;

    /// @notice Data needed for governor to create a new lockup period
    /// and associated reward multiplier
    struct RewardData {
        uint128 lockLength;
        uint128 rewardMultiplier;
    }

    /// @notice Address of Tribe contract.
    /// Cannot be immutable due to limitations of proxies
    IERC20 public TRIBE;
    /// @notice Info of each pool.
    PoolInfo[] public poolInfo;
    /// @notice Address of the token you can stake in each pool.
    IERC20[] public stakedToken;
    /// @notice Address of each `IRewarder` contract.
    IRewarder[] public rewarder;

    /// @notice Info of each users reward debt and virtual amount.
    /// One object is instantiated per user per pool
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    /// @notice Info of each user that stakes tokens.
    mapping(uint256 => mapping(address => DepositInfo[])) public depositInfo;
    /// @dev Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;

    /// @notice these variables cannot be initialized with a constant value
    /// because of the way that upgradeable contracts work, their initial write
    // to storage doesn't happen as the logic contract doesn't run the constructor

    /// the amount of tribe distributed per block
    uint256 private tribalChiefTribePerBlock;
    /// variable has been made constant to cut down on gas costs
    uint256 private ACC_TRIBE_PRECISION;
    /// decimals for rewards multiplier
    uint256 public SCALE_FACTOR;

    event Deposit(
        address indexed user,
        uint256 indexed pid,
        uint256 amount,
        uint256 indexed depositID
    );
    event Withdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount,
        address indexed to
    );
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount,
        address indexed to
    );
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event LogPoolAddition(
        uint256 indexed pid,
        uint256 allocPoint,
        IERC20 indexed stakedToken,
        IRewarder indexed rewarder
    );
    event LogSetPool(
        uint256 indexed pid,
        uint256 allocPoint,
        IRewarder indexed rewarder,
        bool overwrite
    );
    event LogPoolMultiplier(
        uint256 indexed pid,
        uint128 indexed lockLength,
        uint256 indexed multiplier
    );
    event LogUpdatePool(
        uint256 indexed pid,
        uint128 indexed lastRewardBlock,
        uint256 lpSupply,
        uint256 accTribePerShare
    );
    /// @notice tribe withdraw event
    event TribeWithdraw(uint256 amount);
    event NewTribePerBlock(uint256 indexed amount);
    event PoolLocked(bool indexed locked, uint256 indexed pid);

    /// @notice The way this function is constructed, you will not be able to
    /// call initialize after this function is constructed, effectively
    /// only allowing TribalChief to be used through delegate calls.
    /// @param coreAddress The Core contract address.
    constructor(address coreAddress) CoreRef(coreAddress) {}

    /// @param _core The Core contract address.
    /// @param _tribe The TRIBE token contract address.
    function initialize(address _core, IERC20 _tribe) external initializer {
        CoreRef._initialize(_core);

        TRIBE = _tribe;
        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));

        // set constant values here as we cannot use constants with proxies
        tribalChiefTribePerBlock = 75e18;
        ACC_TRIBE_PRECISION = 1e23;
        SCALE_FACTOR = 1e4;
    }

    /// @notice Allows governor to change the amount of tribe per block
    /// make sure to call the update pool function before hitting this function
    /// this will ensure that all of the rewards a user earned previously get paid out
    /// @param newBlockReward The new amount of tribe per block to distribute
    function updateBlockReward(uint256 newBlockReward)
        external
        onlyGovernorOrAdmin
    {
        if (isContractAdmin(msg.sender)) {
            require(
                newBlockReward < tribalChiefTribePerBlock,
                "TribalChief: admin can only lower reward rate"
            );
        }

        tribalChiefTribePerBlock = newBlockReward;
        emit NewTribePerBlock(newBlockReward);
    }

    /// @notice Allows governor to lock the pool so the users cannot withdraw
    /// until their lockup period is over
    /// @param _pid pool ID
    function lockPool(uint256 _pid) external onlyGovernorOrAdmin {
        PoolInfo storage pool = poolInfo[_pid];
        pool.unlocked = false;

        emit PoolLocked(true, _pid);
    }

    /// @notice Allows governor to unlock the pool so that users can withdraw
    /// before their tokens have been locked for the entire lockup period
    /// @param _pid pool ID
    function unlockPool(uint256 _pid) external onlyGovernorOrAdmin {
        PoolInfo storage pool = poolInfo[_pid];
        pool.unlocked = true;

        emit PoolLocked(false, _pid);
    }

    /// @notice Allows governor to change the pool multiplier
    /// Unlocks the pool if the new multiplier is greater than the old one
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
        // if the new multplier is greater than the current multiplier,
        // then, you need to unlock the pool to allow users to withdraw
        // so they can receive this larger reward
        if (newRewardsMultiplier > currentMultiplier) {
            pool.unlocked = true;
            // emit this event if we end up unlocking this pool
            emit PoolLocked(false, _pid);
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
    function numPools() public view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Returns the number of user deposits in a single pool.
    function openUserDeposits(uint256 pid, address user)
        public
        view
        returns (uint256)
    {
        return depositInfo[pid][user].length;
    }

    /// @notice Returns the amount a user deposited in a single pool.
    function getTotalStakedInPool(uint256 pid, address user)
        public
        view
        returns (uint256)
    {
        uint256 amount = 0;
        for (uint256 i = 0; i < depositInfo[pid][user].length; i++) {
            DepositInfo storage poolDeposit = depositInfo[pid][user][i];
            amount += poolDeposit.amount;
        }

        return amount;
    }

    /// @notice Add a new pool. Can only be called by the governor.
    /// @param allocPoint AP of the new pool.
    /// @param _stakedToken Address of the ERC-20 token to stake.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param rewardData Reward Multiplier data
    function add(
        uint120 allocPoint,
        IERC20 _stakedToken,
        IRewarder _rewarder,
        RewardData[] calldata rewardData
    ) external onlyGovernorOrAdmin {
        require(
            allocPoint > 0,
            "pool must have allocation points to be created"
        );
        uint128 lastRewardBlock = block.number.toUint128();
        totalAllocPoint += allocPoint;
        stakedToken.push(_stakedToken);
        rewarder.push(_rewarder);

        uint256 pid = poolInfo.length;

        require(rewardData.length != 0, "must specify rewards");
        // loop over all of the arrays of lock data and add them to the rewardMultipliers mapping
        for (uint256 i = 0; i < rewardData.length; i++) {
            // if locklength is 0 and multiplier is not equal to scale factor, revert
            if (rewardData[i].lockLength == 0) {
                require(
                    rewardData[i].rewardMultiplier == SCALE_FACTOR,
                    "invalid multiplier for 0 lock length"
                );
            } else {
                // else, assert that multplier is greater than or equal to scale factor
                require(
                    rewardData[i].rewardMultiplier >= SCALE_FACTOR,
                    "invalid multiplier, must be above scale factor"
                );
            }

            rewardMultipliers[pid][rewardData[i].lockLength] = rewardData[i]
                .rewardMultiplier;
            emit LogPoolMultiplier(
                pid,
                rewardData[i].lockLength,
                rewardData[i].rewardMultiplier
            );
        }

        poolInfo.push(
            PoolInfo({
                allocPoint: allocPoint,
                virtualTotalSupply: 0, // virtual total supply starts at 0 as there is 0 initial supply
                lastRewardBlock: lastRewardBlock,
                accTribePerShare: 0,
                unlocked: false
            })
        );
        emit LogPoolAddition(pid, allocPoint, _stakedToken, _rewarder);
    }

    /// @notice Update the given pool's TRIBE allocation point and `IRewarder` contract.
    /// Can only be called by the governor.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _allocPoint New AP of the pool.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param overwrite True if _rewarder should be `set`. Otherwise `_rewarder` is ignored.
    function set(
        uint256 _pid,
        uint120 _allocPoint,
        IRewarder _rewarder,
        bool overwrite
    ) public onlyGovernorOrAdmin {
        // we must update the pool before applying set so that all previously accrued rewards
        // are paid out before alloc points change
        updatePool(_pid);
        totalAllocPoint =
            (totalAllocPoint - poolInfo[_pid].allocPoint) +
            _allocPoint;
        require(totalAllocPoint > 0, "total allocation points cannot be 0");

        poolInfo[_pid].allocPoint = _allocPoint;
        if (overwrite) {
            rewarder[_pid] = _rewarder;
        }

        emit LogSetPool(
            _pid,
            _allocPoint,
            overwrite ? _rewarder : rewarder[_pid],
            overwrite
        );
    }

    /// @notice Reset the given pool's TRIBE allocation to 0 and unlock the pool.
    /// Can only be called by the governor or guardian.
    /// @param _pid The index of the pool. See `poolInfo`.
    function resetRewards(uint256 _pid) public onlyGuardianOrGovernor {
        // we must update the pool before resetting rewards so that all previously accrued rewards
        // are paid out before alloc points go to 0 in this pool
        updatePool(_pid);
        PoolInfo storage pool = poolInfo[_pid];
        // set the pool's allocation points to zero
        totalAllocPoint = (totalAllocPoint - pool.allocPoint);
        pool.allocPoint = 0;

        // unlock all staked tokens in the pool
        pool.unlocked = true;

        // erase any IRewarder mapping
        rewarder[_pid] = IRewarder(address(0));

        emit PoolLocked(false, _pid);
        emit LogSetPool(_pid, 0, IRewarder(address(0)), false);
    }

    /// @notice View function to see all pending TRIBE on frontend.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _user Address of user.
    /// @return pending TRIBE reward for a given user.
    function pendingRewards(uint256 _pid, address _user)
        external
        view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 accTribePerShare = pool.accTribePerShare;

        if (
            block.number > pool.lastRewardBlock && pool.virtualTotalSupply != 0
        ) {
            // this is the block delta
            uint256 blocks = block.number - pool.lastRewardBlock;
            // this is the amount of tribe this pool is entitled to for the last n blocks
            uint256 tribeReward = (blocks * tribePerBlock() * pool.allocPoint) /
                totalAllocPoint;
            // this is the new tribe per each pool share
            accTribePerShare =
                accTribePerShare +
                ((tribeReward * ACC_TRIBE_PRECISION) / pool.virtualTotalSupply);
        }

        // use the virtual amount to calculate the users share of the pool and their pending rewards
        return
            (((user.virtualAmount * accTribePerShare) / ACC_TRIBE_PRECISION)
                .toInt256() - user.rewardDebt).toUint256();
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
            if (virtualSupply > 0 && totalAllocPoint != 0) {
                uint256 blocks = block.number - pool.lastRewardBlock;
                uint256 tribeReward = (blocks *
                    tribePerBlock() *
                    pool.allocPoint) / totalAllocPoint;
                pool.accTribePerShare =
                    pool.accTribePerShare +
                    ((tribeReward * ACC_TRIBE_PRECISION) / virtualSupply);
            }
            pool.lastRewardBlock = block.number.toUint128();
            emit LogUpdatePool(
                pid,
                pool.lastRewardBlock,
                virtualSupply,
                pool.accTribePerShare
            );
        }
    }

    /// @notice Deposit tokens to earn TRIBE allocation.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount The token amount to deposit.
    /// @param lockLength The length of time you would like to lock tokens
    function deposit(
        uint256 pid,
        uint256 amount,
        uint64 lockLength
    ) public nonReentrant whenNotPaused {
        // we have to update the pool before we allow a user to deposit so that we can correctly calculate their reward debt
        // if we didn't do this, it would allow users to steal from us by calling deposits and gaining rewards they aren't entitled to
        updatePool(pid);
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage userPoolData = userInfo[pid][msg.sender];
        DepositInfo memory poolDeposit;

        uint128 multiplier = rewardMultipliers[pid][lockLength];
        require(multiplier >= SCALE_FACTOR, "invalid lock length");

        // Effects
        poolDeposit.amount = amount;
        poolDeposit.unlockBlock = (lockLength + block.number).toUint128();
        // set the multiplier here so that on withdraw we can easily reset the
        // multiplier and remove the appropriate amount of virtual liquidity
        poolDeposit.multiplier = multiplier;

        // virtual amount is calculated by taking the users total deposited balance and multiplying
        // it by the multiplier then adding it to the aggregated virtual amount
        uint256 virtualAmountDelta = (amount * multiplier) / SCALE_FACTOR;
        userPoolData.virtualAmount += virtualAmountDelta;
        // update reward debt after virtual amount is set by multiplying virtual amount delta by tribe per share
        // this tells us when the user deposited and allows us to calculate their rewards later
        userPoolData.rewardDebt += ((virtualAmountDelta *
            pool.accTribePerShare) / ACC_TRIBE_PRECISION).toInt256();

        // pool virtual total supply needs to increase here
        pool.virtualTotalSupply += virtualAmountDelta;

        // add the new user struct into storage
        depositInfo[pid][msg.sender].push(poolDeposit);

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(
                pid,
                msg.sender,
                msg.sender,
                0,
                userPoolData.virtualAmount
            );
        }

        stakedToken[pid].safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(
            msg.sender,
            pid,
            amount,
            depositInfo[pid][msg.sender].length - 1
        );
    }

    /// @notice Withdraw staked tokens from pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of the tokens.
    function withdrawAllAndHarvest(uint256 pid, address to)
        external
        nonReentrant
    {
        // update the pool, so that accTribePerShare is accurate, then harvest
        updatePool(pid);
        _harvest(pid, to);

        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        uint256 unlockedTotalAmount = 0;
        uint256 virtualLiquidityDelta = 0;

        // iterate over all deposits this user has and aggregate the deltas
        uint256 processedDeposits = 0;
        for (uint256 i = 0; i < depositInfo[pid][msg.sender].length; i++) {
            DepositInfo storage poolDeposit = depositInfo[pid][msg.sender][i];
            // if the user has locked the tokens for at least the
            // lockup period or the pool has been unlocked, allow
            // user to withdraw their principle from this deposit, otherwise skip this action
            if (
                poolDeposit.unlockBlock > block.number && pool.unlocked == false
            ) {
                continue;
            }

            // if we get past continue, it means that we are going to process this deposit
            // and send these tokens back to the user
            processedDeposits++;

            // gather the virtual and regular amount delta
            unlockedTotalAmount += poolDeposit.amount;
            virtualLiquidityDelta +=
                (poolDeposit.amount * poolDeposit.multiplier) /
                SCALE_FACTOR;

            // zero out the user object as their amount will be withdrawn and all pending tribe will be paid out
            poolDeposit.unlockBlock = 0;
            poolDeposit.multiplier = 0;
            poolDeposit.amount = 0;
        }

        // Effects
        if (processedDeposits == depositInfo[pid][msg.sender].length) {
            // Remove the array of deposits and userInfo struct if we were able to withdraw from all deposits.
            // If we removed all liquidity, then we can just delete all the data we stored on this user
            // in both depositinfo and userinfo, which means that their reward debt, and virtual liquidity
            // are all zero'd.
            delete depositInfo[pid][msg.sender];
            delete userInfo[pid][msg.sender];
        } else {
            // If we didn't end up being able to withdraw all of the liquidity from all of our deposits
            // then we will just update the userInfo object for the amounts that we did remove.
            // Batched changes are done at the end of the function so that we don't
            // write to these storage slots multiple times
            user.virtualAmount -= virtualLiquidityDelta;
            // Set the reward debt to the new virtual amount
            // we don't have to worry about increasing the reward debt here as the harvest function
            // has already paid out all pending tribe the users deserves.
            // Here, we just have to make the reward debt equal to:
            // (current tribe per share * the virtual liquidity) / ACC_TRIBE_PRECISION
            // of that user so that it is accurate.
            user.rewardDebt = ((user.virtualAmount * pool.accTribePerShare) /
                ACC_TRIBE_PRECISION).toInt256();
        }

        // regardless of whether or not we removed all of this users liquidity from the pool, we will need to
        // subtract the virtual liquidity delta from the pool virtual total supply
        pool.virtualTotalSupply -= virtualLiquidityDelta;

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, user.virtualAmount);
        }

        if (unlockedTotalAmount != 0) {
            stakedToken[pid].safeTransfer(to, unlockedTotalAmount);
        }

        emit Withdraw(msg.sender, pid, unlockedTotalAmount, to);
    }

    /// @notice Withdraw tokens from pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount Token amount to withdraw.
    /// @param to Receiver of the tokens.
    function withdrawFromDeposit(
        uint256 pid,
        uint256 amount,
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
        require(
            poolDeposit.unlockBlock <= block.number || pool.unlocked == true,
            "tokens locked"
        );

        uint256 virtualAmountDelta = (amount * poolDeposit.multiplier) /
            SCALE_FACTOR;

        // Effects
        poolDeposit.amount -= amount;
        user.rewardDebt =
            user.rewardDebt -
            ((virtualAmountDelta * pool.accTribePerShare) / ACC_TRIBE_PRECISION)
                .toInt256();
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
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        // assumption here is that we will never go over 2^256 -1
        int256 accumulatedTribe = ((user.virtualAmount *
            pool.accTribePerShare) / ACC_TRIBE_PRECISION).toInt256();

        // this should never happen
        assert(
            accumulatedTribe >= 0 && accumulatedTribe - user.rewardDebt >= 0
        );

        uint256 pendingTribe = (accumulatedTribe - user.rewardDebt).toUint256();

        // if pending tribe is ever negative, revert as this can cause an underflow when we turn this number to a uint
        assert(pendingTribe.toInt256() >= 0);

        // Effects
        user.rewardDebt = accumulatedTribe;

        // Interactions
        if (pendingTribe != 0) {
            TRIBE.safeTransfer(to, pendingTribe);
        }

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(
                pid,
                msg.sender,
                to,
                pendingTribe,
                user.virtualAmount
            );
        }

        emit Harvest(msg.sender, pid, pendingTribe);
    }

    /// @notice Harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of TRIBE rewards.
    function harvest(uint256 pid, address to) public nonReentrant {
        updatePool(pid);
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

        uint256 totalUnlocked = 0;
        uint256 virtualLiquidityDelta = 0;
        for (uint256 i = 0; i < depositInfo[pid][msg.sender].length; i++) {
            DepositInfo storage poolDeposit = depositInfo[pid][msg.sender][i];

            // if the user has locked the tokens for at least the
            // lockup period or the pool has been unlocked, allow
            // user to withdraw their principle
            require(
                poolDeposit.unlockBlock <= block.number ||
                    pool.unlocked == true,
                "tokens locked"
            );

            totalUnlocked += poolDeposit.amount;

            // update the aggregated deposit virtual amount
            // update the virtualTotalSupply
            virtualLiquidityDelta +=
                (poolDeposit.amount * poolDeposit.multiplier) /
                SCALE_FACTOR;
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
