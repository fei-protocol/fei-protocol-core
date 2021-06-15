3c3,4
< pragma solidity ^0.8.0;
---
> pragma solidity 0.6.12;
> pragma experimental ABIEncoderV2;
5,9c6,11
< import "./../refs/CoreRef.sol";
< import "./IRewardsDistributor.sol";
< import "./BoringBatchable.sol";
< import "./IRewarder.sol";
< import "./IMasterChief.sol";
---
> import "@boringcrypto/boring-solidity/contracts/libraries/BoringMath.sol";
> import "@boringcrypto/boring-solidity/contracts/BoringBatchable.sol";
> import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";
> import "./libraries/SignedSafeMath.sol";
> import "./interfaces/IRewarder.sol";
> import "./interfaces/IMasterChef.sol";
22,23c24,28
< contract MasterChief is CoreRef, BoringBatchable {
<     using SafeERC20 for IERC20;
---
> contract MasterChefV2 is BoringOwnable, BoringBatchable {
>     using BoringMath for uint256;
>     using BoringMath128 for uint128;
>     using BoringERC20 for IERC20;
>     using SignedSafeMath for int256;
42,43c47,48
<     /// @notice Address of the Core contract
<     ICore public immutable Core;
---
>     /// @notice Address of MCV1 contract.
>     IMasterChef public immutable MASTER_CHEF;
45a51,52
>     /// @notice The index of MCV2 master pool in MCV1.
>     uint256 public immutable MASTER_PID;
61,63c68,69
<     uint256 private MASTERCHEF_SUSHI_PER_BLOCK = 1e20;
<     // variable has been made immutable to cut down on gas costs
<     uint256 private immutable ACC_SUSHI_PRECISION = 1e12;
---
>     uint256 private constant MASTERCHEF_SUSHI_PER_BLOCK = 1e20;
>     uint256 private constant ACC_SUSHI_PRECISION = 1e12;
73,74d78
<     /// @notice tribe withdraw event
<     event TribeWithdraw(uint256 _amount);
76c80
<     /// @param _iCORE The Core contract address.
---
>     /// @param _MASTER_CHEF The SushiSwap MCV1 contract address.
78,79c82,84
<     constructor(ICore _iCORE, IERC20 _sushi) CoreRef(address(_iCORE)) {
<         Core = _iCORE;
---
>     /// @param _MASTER_PID The pool ID of the dummy token on the base MCV1 contract.
>     constructor(IMasterChef _MASTER_CHEF, IERC20 _sushi, uint256 _MASTER_PID) public {
>         MASTER_CHEF = _MASTER_CHEF;
81,91c86
<     }
< 
<     function updateBlockReward(uint256 newBlockReward) external onlyGovernor {
<         MASTERCHEF_SUSHI_PER_BLOCK = newBlockReward;
<     }
< 
<     /// @notice sends tokens back to governance treasury. Only callable by governance
<     /// @param amount the amount of tokens to send back to treasury
<     function governorWithdrawTribe(uint256 amount) external onlyGovernor {
<         SUSHI.safeTransfer(address(Core), amount);
<         emit TribeWithdraw(amount);
---
>         MASTER_PID = _MASTER_PID;
101a97,98
>         dummyToken.approve(address(MASTER_CHEF), balance);
>         MASTER_CHEF.deposit(MASTER_PID, balance);
110,116d106
<     /// @notice borrowed from boring math, translated up to solidity V8
<     function to64(uint256 a) internal pure returns (uint64 c) {
<         // 18446744073709551615 equals 1111111111111111111111111111111111111111111111111111111111111111 which is uint64 max
<         require(a <= 18446744073709551615, "BoringMath: uint64 Overflow");
<         c = uint64(a);
<     }
< 
122c112
<     function add(uint256 allocPoint, IERC20 _lpToken, IRewarder _rewarder) public onlyGovernor {
---
>     function add(uint256 allocPoint, IERC20 _lpToken, IRewarder _rewarder) public onlyOwner {
124c114
<         totalAllocPoint += allocPoint;
---
>         totalAllocPoint = totalAllocPoint.add(allocPoint);
129,130c119,120
<             allocPoint: to64(allocPoint),
<             lastRewardBlock: to64(lastRewardBlock),
---
>             allocPoint: allocPoint.to64(),
>             lastRewardBlock: lastRewardBlock.to64(),
133c123
<         emit LogPoolAddition(lpToken.length - 1, allocPoint, _lpToken, _rewarder);
---
>         emit LogPoolAddition(lpToken.length.sub(1), allocPoint, _lpToken, _rewarder);
141,143c131,133
<     function set(uint256 _pid, uint256 _allocPoint, IRewarder _rewarder, bool overwrite) public onlyGovernor {
<         totalAllocPoint = (totalAllocPoint - poolInfo[_pid].allocPoint) + _allocPoint;
<         poolInfo[_pid].allocPoint = to64(_allocPoint);
---
>     function set(uint256 _pid, uint256 _allocPoint, IRewarder _rewarder, bool overwrite) public onlyOwner {
>         totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
>         poolInfo[_pid].allocPoint = _allocPoint.to64();
150c140
<     function setMigrator(IMigratorChef _migrator) public onlyGovernor {
---
>     function setMigrator(IMigratorChef _migrator) public onlyOwner {
176,178c166,168
<             uint256 blocks = block.number - pool.lastRewardBlock;
<             uint256 sushiReward = (blocks * sushiPerBlock() * pool.allocPoint) / totalAllocPoint;
<             accSushiPerShare = accSushiPerShare + ((sushiReward * ACC_SUSHI_PRECISION) / lpSupply);
---
>             uint256 blocks = block.number.sub(pool.lastRewardBlock);
>             uint256 sushiReward = blocks.mul(sushiPerBlock()).mul(pool.allocPoint) / totalAllocPoint;
>             accSushiPerShare = accSushiPerShare.add(sushiReward.mul(ACC_SUSHI_PRECISION) / lpSupply);
180,183c170
<         pending = uint256(
<             int256((user.amount * accSushiPerShare) / ACC_SUSHI_PRECISION)
<              - (user.rewardDebt)
<         );
---
>         pending = int256(user.amount.mul(accSushiPerShare) / ACC_SUSHI_PRECISION).sub(user.rewardDebt).toUInt256();
197c184,185
<         amount = uint256(MASTERCHEF_SUSHI_PER_BLOCK);
---
>         amount = uint256(MASTERCHEF_SUSHI_PER_BLOCK)
>             .mul(MASTER_CHEF.poolInfo(MASTER_PID).allocPoint) / MASTER_CHEF.totalAllocPoint();
208,210c196,198
<                 uint256 blocks = block.number - pool.lastRewardBlock;
<                 uint256 sushiReward = (blocks * sushiPerBlock() * pool.allocPoint) / totalAllocPoint;
<                 pool.accSushiPerShare = uint128(pool.accSushiPerShare + ((sushiReward * ACC_SUSHI_PRECISION) / lpSupply));
---
>                 uint256 blocks = block.number.sub(pool.lastRewardBlock);
>                 uint256 sushiReward = blocks.mul(sushiPerBlock()).mul(pool.allocPoint) / totalAllocPoint;
>                 pool.accSushiPerShare = pool.accSushiPerShare.add((sushiReward.mul(ACC_SUSHI_PRECISION) / lpSupply).to128());
212c200
<             pool.lastRewardBlock = to64(block.number);
---
>             pool.lastRewardBlock = block.number.to64();
227,228c215,216
<         user.amount += amount;
<         user.rewardDebt = user.rewardDebt + int256((amount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
---
>         user.amount = user.amount.add(amount);
>         user.rewardDebt = user.rewardDebt.add(int256(amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
250,251c238,239
<         user.rewardDebt = user.rewardDebt - (int256((amount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
<         user.amount -= amount;
---
>         user.rewardDebt = user.rewardDebt.sub(int256(amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
>         user.amount = user.amount.sub(amount);
270,271c258,259
<         int256 accumulatedSushi = int256((user.amount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
<         uint256 _pendingSushi = uint256(accumulatedSushi - user.rewardDebt);
---
>         int256 accumulatedSushi = int256(user.amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
>         uint256 _pendingSushi = accumulatedSushi.sub(user.rewardDebt).toUInt256();
296,297c284,285
<         uint256 accumulatedSushi = (user.amount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION;
<         uint256 _pendingSushi = uint256((accumulatedSushi - uint256(user.rewardDebt)));
---
>         int256 accumulatedSushi = int256(user.amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
>         uint256 _pendingSushi = accumulatedSushi.sub(user.rewardDebt).toUInt256();
300,301c288,289
<         user.rewardDebt = int256(accumulatedSushi - (uint256(amount * pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
<         user.amount -= amount;
---
>         user.rewardDebt = accumulatedSushi.sub(int256(amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
>         user.amount = user.amount.sub(amount);
316a305,309
>     /// @notice Harvests SUSHI from `MASTER_CHEF` MCV1 and pool `MASTER_PID` to this MCV2 contract.
>     function harvestFromMasterChef() public {
>         MASTER_CHEF.deposit(MASTER_PID, 0);
>     }
> 
