// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./../refs/CoreRef.sol";
import "./IRewardsDistributor.sol";
import "./BoringBatchable.sol";
import "./IRewarder.sol";
import "./IMasterChief.sol";

import "hardhat/console.sol";

/// @notice migration functionality has been removed as this is only going to be used to distribute staking rewards

/// @notice The idea for this MasterChief V2 (MCV2) contract is therefore to be the owner of tribe token
/// that is deposited into this contract.
/// @notice This contract was forked from sushiswap and has been modified to distribute staking rewards in tribe.
/// All legacy code that relied on MasterChef V1 has been removed so that this contract will pay out staking rewards in tribe.
/// The assumption this code makes is that this MasterChief contract will be funded before going live and offering staking rewards.
/// This contract will not have the ability to mint tribe.
contract MasterChief is CoreRef, BoringBatchable {
    using SafeERC20 for IERC20;

    /// @notice Info of each MCV2 user.
    /// `amount` LP token amount the user has provided.
    /// `rewardDebt` The amount of SUSHI entitled to the user.
    /// assumption here is that we will never go over 2^128 -1
    /// on any user deposits or reward debts
    struct UserInfo {
        uint128 amount;
        uint128 virtualAmount;
        uint128 rewardDebt;
        uint64 unlockBlock;
        uint256 multiplier;
    }

    /// @notice Info of each MCV2 pool.
    /// `allocPoint` The amount of allocation points assigned to the pool.
    /// Also known as the amount of SUSHI to distribute per block.
    struct PoolInfo {
        uint128 accSushiPerShare;
        uint128 virtualPoolTotalSupply;
        uint64 lastRewardBlock;
        uint64 allocPoint;
        uint64 lockupPeriod;
        bool forcedLock; // this boolean forces users to lock if they use this pool
        bool unlocked; // this will allow an admin to unlock the pool if need be
    }

    /// @notice Info of each MCV2 pool rewards multipliers available.
    /// map a pool id to a block lock time to a rewards multiplier
    mapping (uint256 => mapping (uint64 => uint256)) public rewardMultipliers;

    struct RewardData {
        uint64 lockLength;
        uint256 rewardMultiplier;
    }

    /// @notice Address of SUSHI contract.
    IERC20 public immutable SUSHI;

    /// @notice Info of each MCV2 pool.
    PoolInfo[] public poolInfo;
    /// @notice Address of the LP token for each MCV2 pool.
    IERC20[] public lpToken;
    /// @notice Address of each `IRewarder` contract in MCV2.
    IRewarder[] public rewarder;

    /// @notice Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo[])) public userInfo;
    /// @dev Total allocation points. Must be the sum of all allocation points in all pools.
    uint128 public totalAllocPoint;

    uint256 private masterChefSushiPerBlock = 1e20;
    // variable has been made immutable to cut down on gas costs
    uint256 private immutable ACC_SUSHI_PRECISION = 1e12;
    uint256 public immutable scaleFactor = 1e18;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 indexed depositID);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event LogPoolAddition(uint256 indexed pid, uint256 allocPoint, IERC20 indexed lpToken, IRewarder indexed rewarder);
    event LogSetPool(uint256 indexed pid, uint256 allocPoint, IRewarder indexed rewarder, bool overwrite);
    event LogPoolMultiplier(uint256 indexed pid, uint64 indexed lockLength, uint256 indexed multiplier);
    event LogUpdatePool(uint256 indexed pid, uint64 lastRewardBlock, uint256 lpSupply, uint256 accSushiPerShare);
    event LogInit();
    /// @notice tribe withdraw event
    event TribeWithdraw(uint256 amount);

    /// @param _core The Core contract address.
    /// @param _sushi The SUSHI token contract address.
    constructor(address _core, IERC20 _sushi) CoreRef(_core) {
        SUSHI = _sushi;
    }

    function updateBlockReward(uint256 newBlockReward) external onlyGovernor {
        masterChefSushiPerBlock = newBlockReward;
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
    function governorChangePoolMultiplier(
        uint256 _pid,
        uint64 lockLength, 
        uint256 newRewardsMultiplier
    ) external onlyGovernor {
        PoolInfo storage pool = poolInfo[_pid];
        require(rewardMultipliers[_pid][lockLength] > 0, "pool does not exist");
        uint256 currentMultiplier = rewardMultipliers[_pid][lockLength];
        // if the new multplier is less than the current multiplier,
        // then, you need to unlock the pool to allow users to withdraw
        if (newRewardsMultiplier < currentMultiplier) {
            pool.unlocked = true;
        }
        rewardMultipliers[_pid][lockLength] = newRewardsMultiplier;

        emit LogPoolMultiplier(_pid, lockLength, newRewardsMultiplier);
    }

    /// @notice adds a new pool multiplier
    /// @param _pid pool ID
    /// @param newRewardsMultiplier updated rewards multiplier
    function governorAddPoolMultiplier(
        uint256 _pid,
        uint64 lockLength, 
        uint256 newRewardsMultiplier
    ) external onlyGovernor {
        require(rewardMultipliers[_pid][lockLength] == 0, "pool already exists");
        // create the new multiplier and lockup period
        rewardMultipliers[_pid][lockLength] = newRewardsMultiplier;

        emit LogPoolMultiplier(_pid, lockLength, newRewardsMultiplier);
    }

    /// @notice sends tokens back to governance treasury. Only callable by governance
    /// @param amount the amount of tokens to send back to treasury
    function governorWithdrawTribe(uint256 amount) external onlyGovernor {
        SUSHI.safeTransfer(address(core()), amount);
        emit TribeWithdraw(amount);
    }

    /// @notice Returns the number of MCV2 pools.
    function poolLength() public view returns (uint256 pools) {
        pools = poolInfo.length;
    }

    /// @notice Returns the number of user deposits in a single pool.
    function userDepositAmount(uint256 pid, address user) public view returns (uint256) {
        return userInfo[pid][user].length;
    }

    /// @notice borrowed from boring math, translated up to solidity V8
    function to64(uint256 a) internal pure returns (uint64 c) {
        require(a <= type(uint64).max, "BoringMath: uint64 Overflow");
        c = uint64(a);
    }

    /// @notice Add a new LP to the pool. Can only be called by the owner.
    /// DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    /// @param allocPoint AP of the new pool.
    /// @param _lpToken Address of the LP ERC-20 token.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param lockupPeriod Block number that users must lock up for
    /// @param forcedLock Whether or not this pool forces users to lock up their funds
    /// @param unlocked Whether or not users can get out of their obligation to lock up for a certain amount of time
    /// @param rewardData Reward Multiplier data 
    function add(
        uint128 allocPoint,
        IERC20 _lpToken,
        IRewarder _rewarder,
        uint64 lockupPeriod,
        bool forcedLock,
        bool unlocked,
        RewardData[] calldata rewardData
    ) external onlyGovernor {
        require(rewardData.length > 0, "invalid reward data");

        uint256 lastRewardBlock = block.number;
        totalAllocPoint += allocPoint;
        lpToken.push(_lpToken);
        rewarder.push(_rewarder);

        uint256 pid = poolInfo.length;

        // loop over all of the arrays of lock data and add them to the rewardMultipliers mapping
        for (uint256 i = 0; i < rewardData.length; i++) {
            require(rewardData[i].lockLength > 0, "invalid lock length");
            require(rewardData[i].rewardMultiplier >= scaleFactor, "invalid multiplier");

            rewardMultipliers[pid][rewardData[i].lockLength] = rewardData[i].rewardMultiplier;
            emit LogPoolMultiplier(
                pid,
                rewardData[i].lockLength,
                rewardData[i].rewardMultiplier
            );
        }

        poolInfo.push(PoolInfo({
            allocPoint: to64(allocPoint),
            virtualPoolTotalSupply: 0, // virtual total supply starts at 0 as there is 0 initial supply
            lastRewardBlock: to64(lastRewardBlock),
            accSushiPerShare: 1,
            lockupPeriod: lockupPeriod,
            forcedLock: forcedLock,
            unlocked: unlocked
        }));
        emit LogPoolAddition(lpToken.length - 1, allocPoint, _lpToken, _rewarder);
    }

    /// @notice Update the given pool's SUSHI allocation point and `IRewarder` contract. Can only be called by the owner.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _allocPoint New AP of the pool.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param overwrite True if _rewarder should be `set`. Otherwise `_rewarder` is ignored.
    function set(uint256 _pid, uint128 _allocPoint, IRewarder _rewarder, bool overwrite) public onlyGovernor {
        totalAllocPoint = (totalAllocPoint - poolInfo[_pid].allocPoint) + _allocPoint;
        poolInfo[_pid].allocPoint = to64(_allocPoint);

        if (overwrite) {
            rewarder[_pid] = _rewarder;
        }

        emit LogSetPool(_pid, _allocPoint, overwrite ? _rewarder : rewarder[_pid], overwrite);
    }

    /// @notice View function to see pending SUSHI on frontend.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _user Address of user.
    /// @param index array index of the deposit to harvest
    /// @return pending SUSHI reward for a given user.
    function pendingSushi(uint256 _pid, address _user, uint256 index) external view returns (uint256 pending) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user][index];

        uint256 accSushiPerShare = pool.accSushiPerShare;

        if (block.number > pool.lastRewardBlock && pool.virtualPoolTotalSupply != 0) {
            uint256 blocks = block.number - pool.lastRewardBlock;
            uint256 sushiReward = (blocks * sushiPerBlock() * pool.allocPoint) / totalAllocPoint;
            // console.log("sushiReward: ", sushiReward);
            accSushiPerShare = accSushiPerShare + ((sushiReward * ACC_SUSHI_PRECISION) / pool.virtualPoolTotalSupply);
        }
        // use the virtual amount to calculate the users share of the pool and their pending rewards
        // console.log("accSushiPerShare: ", accSushiPerShare);
        // console.log("virtualPoolTotalSupply: ", pool.virtualPoolTotalSupply);
        pending = uint256( uint128( ( user.virtualAmount * accSushiPerShare ) / ACC_SUSHI_PRECISION ) - user.rewardDebt );
        // console.log("user.rewardDebt: ", user.rewardDebt);
        // console.log("user.virtualAmount: ", user.virtualAmount);
        // console.log("\n\n\n");
    }

    /// @notice Update reward variables for all pools. Be careful of gas spending!
    /// @param pids Pool IDs of all to be updated. Make sure to update all active pools.
    function massUpdatePools(uint256[] calldata pids) external {
        uint256 len = pids.length;
        for (uint256 i = 0; i < len; ++i) {
            updatePool(pids[i]);
        }
    }

    /// @notice Calculates and returns the `amount` of SUSHI per block.
    function sushiPerBlock() public view returns (uint256 amount) {
        amount = uint256(masterChefSushiPerBlock);
    }

    /// @notice Update reward variables of the given pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @return pool Returns the pool that was updated.
    function updatePool(uint256 pid) public returns (PoolInfo memory pool) {
        pool = poolInfo[pid];
        if (block.number > pool.lastRewardBlock) {
            uint256 virtualSupply = pool.virtualPoolTotalSupply;
            if (virtualSupply > 0) {
                // console.log("virtual supply greater than 0");
                uint256 blocks = block.number - pool.lastRewardBlock;
                uint256 sushiReward = (blocks * sushiPerBlock() * pool.allocPoint) / totalAllocPoint;
                // console.log("before pool.accSushiPerShare: ", pool.accSushiPerShare);
                pool.accSushiPerShare = uint128(pool.accSushiPerShare + ((sushiReward * ACC_SUSHI_PRECISION) / virtualSupply));
                // console.log("after pool.accSushiPerShare: ", pool.accSushiPerShare);
                // console.log("virtualSupply: ", virtualSupply);
            }
            pool.lastRewardBlock = to64(block.number);
            poolInfo[pid] = pool;
            emit LogUpdatePool(pid, pool.lastRewardBlock, virtualSupply, pool.accSushiPerShare);
        }
    }

    /// @notice Deposit LP tokens to MCV2 for SUSHI allocation.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount LP token amount to deposit.
    /// @param lockLength The length of time you would like to lock tokens
    /// if locking is not enforced, this value can be 0. If locking is enforced,
    /// a user must pass a valid 
    /// @dev you can only deposit on a single deposit id once.
    function deposit(uint256 pid, uint128 amount, uint64 lockLength) public {
        PoolInfo memory pool = updatePool(pid);
        PoolInfo storage poolPointer = poolInfo[pid];
        UserInfo memory user;

        // Effects
        user.amount += amount;

        uint256 multiplier;
        // if the user opted to lock their tokens up
        // or the pool forces users to lock their funds
        if (lockLength != 0 || pool.forcedLock) {
            // if a user has already locked tokens, then they will just have their unlock block updated
            // if locking is forced, then we will validate that the locklength is correct
            user.unlockBlock = lockLength == 0 ? uint64(uint256(pool.lockupPeriod) + block.number) : uint64(lockLength + block.number);
            multiplier = rewardMultipliers[pid][lockLength];
            require(multiplier > 0, "invalid multiplier");
            // set the multiplier here so that on withdraw we can easily reset the multiplier
            user.multiplier = multiplier;
            // virtual amount is calculated by taking the users total deposited balance and multiplying
            // it by the multiplier
            user.virtualAmount = uint128((user.amount * multiplier) / scaleFactor);
        } else {
            // add on to the virtual amount if the user has not locked their tokens
            user.virtualAmount += amount;
        }

        // pool virtual total supply needs to increase here
        poolPointer.virtualPoolTotalSupply += user.virtualAmount;

        // update reward debt after virtual amount is set
        user.rewardDebt = user.rewardDebt + uint128((user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION);

        // console.log("deposit started");
        // console.log("user.rewardDebt: ", user.rewardDebt);
        // console.log("user.virtualAmount: ", user.virtualAmount);
        // console.log("pool.accSushiPerShare: ", pool.accSushiPerShare);

        userInfo[pid][msg.sender].push(user);
        uint256 depositID = userInfo[pid][msg.sender].length - 1;

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
    /// @param amount LP token amount to withdraw.
    /// @param to Receiver of the LP tokens.
    function withdrawAll(uint256 pid, uint128 amount, address to) public {
        PoolInfo memory pool = updatePool(pid);
        PoolInfo storage poolPointer = poolInfo[pid];
        // iterate over all deposits this user has.
        for (uint256 i = 0; i < userInfo[pid][msg.sender].length; i++) {
            UserInfo storage user = userInfo[pid][msg.sender][i];
            // if the user has locked the tokens for at least the 
            // lockup period or the pool has been unlocked, allow 
            // user to withdraw their principle
            require(user.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

            // Effects
            user.amount -= amount;
            user.rewardDebt = user.rewardDebt - (uint128((user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
            poolPointer.virtualPoolTotalSupply -= user.virtualAmount;

            user.virtualAmount = uint128((user.amount * user.multiplier) / scaleFactor);
            poolPointer.virtualPoolTotalSupply += user.virtualAmount;

            // Interactions
            IRewarder _rewarder = rewarder[pid];
            if (address(_rewarder) != address(0)) {
                _rewarder.onSushiReward(pid, msg.sender, to, 0, user.amount);
            }

            lpToken[pid].safeTransfer(to, amount);

            emit Withdraw(msg.sender, pid, amount, to);
        }
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
        require(userInfo[pid][msg.sender].length > index, "invalid index");
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender][index];
        // if the user has locked the tokens for at least the 
        // lockup period or the pool has been unlocked, allow 
        // user to withdraw their principle
        require(user.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

        // Effects
        user.amount -= amount;
        user.rewardDebt = user.rewardDebt - (uint128((user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION));

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
    /// @param to Receiver of SUSHI rewards.
    function harvestAll(uint256 pid, address to) public {
        PoolInfo memory pool = updatePool(pid);

        for (uint256 i = 0; i < userInfo[pid][msg.sender].length; i++) {
            UserInfo storage user = userInfo[pid][msg.sender][i];
            // assumption here is that we will never go over 2^128 -1
            uint128 accumulatedSushi = uint128((user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
            uint256 _pendingSushi = uint256(accumulatedSushi - user.rewardDebt);

            // Effects
            user.rewardDebt = accumulatedSushi;

            // Interactions
            if (_pendingSushi != 0) {
                SUSHI.safeTransfer(to, _pendingSushi);
            }
            
            IRewarder _rewarder = rewarder[pid];
            if (address(_rewarder) != address(0)) {
                _rewarder.onSushiReward( pid, msg.sender, to, _pendingSushi, user.amount);
            }

            emit Harvest(msg.sender, pid, _pendingSushi);
        }
    }
    

    /// @notice Harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of SUSHI rewards.
    /// @param index array index of the deposit to harvest
    function harvest(uint256 pid, address to, uint256 index) public {
        require(userInfo[pid][msg.sender].length > index, "invalid index");

        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender][index];

        // assumption here is that we will never go over 2^128 -1
        uint128 accumulatedSushi = uint128((user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
        uint256 _pendingSushi = uint256(accumulatedSushi - user.rewardDebt);

        // Effects
        user.rewardDebt = accumulatedSushi;

        // Interactions
        if (_pendingSushi != 0) {
            SUSHI.safeTransfer(to, _pendingSushi);
        }
        
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward( pid, msg.sender, to, _pendingSushi, user.amount);
        }

        emit Harvest(msg.sender, pid, _pendingSushi);
    }
    
    /// @notice Withdraw LP tokens from MCV2 and harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount LP token amount to withdraw.
    /// @param to Receiver of the LP tokens and SUSHI rewards.
    /// @param index array index of the deposit to withdraw
    function withdrawAndHarvest(
        uint256 pid,
        uint128 amount,
        address to,
        uint256 index
    ) public {
        require(userInfo[pid][msg.sender].length > index, "invalid index");

        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender][index];
        // if the user has locked the tokens for at least the 
        // lockup period or the pool has been unlocked, allow 
        // user to withdraw their principle
        require(user.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

        uint256 accumulatedSushi = (user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION;
        uint256 _pendingSushi = uint256((accumulatedSushi - uint256(user.rewardDebt)));

        // Effects
        user.rewardDebt = uint128(accumulatedSushi - (uint256(user.virtualAmount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
        user.amount -= amount;
        // virtual amount will now change as the user's principle has gone down
        user.virtualAmount = uint128(user.multiplier * user.amount);
        
        // Interactions
        SUSHI.safeTransfer(to, _pendingSushi);

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, _pendingSushi, user.amount);
        }

        lpToken[pid].safeTransfer(to, amount);

        emit Withdraw(msg.sender, pid, amount, to);
        emit Harvest(msg.sender, pid, _pendingSushi);
    }

    /// @notice Withdraw without caring about rewards. EMERGENCY ONLY.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of the LP tokens.
    /// @param index array index of the deposit to withdraw
    function emergencyWithdraw(uint256 pid, address to, uint256 index) public {
        require(userInfo[pid][msg.sender].length > index, "invalid index");

        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender][index];
        // if the user has locked the tokens for at least the 
        // lockup period or the pool has been unlocked, allow 
        // user to withdraw their principle
        require(user.unlockBlock <= block.number || pool.unlocked == true, "tokens locked");

        uint256 amount = user.amount;
        // on emergency withdraw, zero all fields
        user.amount = 0;
        user.virtualAmount = 0;
        user.rewardDebt = 0;
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
