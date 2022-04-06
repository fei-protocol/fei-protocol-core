## <span id="TribalChief"></span> `TribalChief`



- [`initializer()`][Initializable-initializer--]
- [`onlyInitializing()`][Initializable-onlyInitializing--]
- [`nonReentrant()`][ReentrancyGuard-nonReentrant--]
- [`ifMinterSelf()`][CoreRef-ifMinterSelf--]
- [`onlyMinter()`][CoreRef-onlyMinter--]
- [`onlyBurner()`][CoreRef-onlyBurner--]
- [`onlyPCVController()`][CoreRef-onlyPCVController--]
- [`onlyGovernorOrAdmin()`][CoreRef-onlyGovernorOrAdmin--]
- [`onlyGovernor()`][CoreRef-onlyGovernor--]
- [`onlyGuardianOrGovernor()`][CoreRef-onlyGuardianOrGovernor--]
- [`isGovernorOrGuardianOrAdmin()`][CoreRef-isGovernorOrGuardianOrAdmin--]
- [`onlyTribeRole(bytes32 role)`][CoreRef-onlyTribeRole-bytes32-]
- [`hasAnyOfTwoRoles(bytes32 role1, bytes32 role2)`][CoreRef-hasAnyOfTwoRoles-bytes32-bytes32-]
- [`hasAnyOfThreeRoles(bytes32 role1, bytes32 role2, bytes32 role3)`][CoreRef-hasAnyOfThreeRoles-bytes32-bytes32-bytes32-]
- [`hasAnyOfFourRoles(bytes32 role1, bytes32 role2, bytes32 role3, bytes32 role4)`][CoreRef-hasAnyOfFourRoles-bytes32-bytes32-bytes32-bytes32-]
- [`hasAnyOfFiveRoles(bytes32 role1, bytes32 role2, bytes32 role3, bytes32 role4, bytes32 role5)`][CoreRef-hasAnyOfFiveRoles-bytes32-bytes32-bytes32-bytes32-bytes32-]
- [`onlyFei()`][CoreRef-onlyFei--]
- [`whenNotPaused()`][Pausable-whenNotPaused--]
- [`whenPaused()`][Pausable-whenPaused--]
- [`constructor(address coreAddress)`][TribalChief-constructor-address-]
- [`initialize(address _core, contract IERC20 _tribe)`][TribalChief-initialize-address-contract-IERC20-]
- [`updateBlockReward(uint256 newBlockReward)`][TribalChief-updateBlockReward-uint256-]
- [`lockPool(uint256 _pid)`][TribalChief-lockPool-uint256-]
- [`unlockPool(uint256 _pid)`][TribalChief-unlockPool-uint256-]
- [`governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier)`][TribalChief-governorAddPoolMultiplier-uint256-uint64-uint64-]
- [`governorWithdrawTribe(uint256 amount)`][TribalChief-governorWithdrawTribe-uint256-]
- [`numPools()`][TribalChief-numPools--]
- [`openUserDeposits(uint256 pid, address user)`][TribalChief-openUserDeposits-uint256-address-]
- [`getTotalStakedInPool(uint256 pid, address user)`][TribalChief-getTotalStakedInPool-uint256-address-]
- [`add(uint120 allocPoint, contract IERC20 _stakedToken, contract IRewarder _rewarder, struct TribalChief.RewardData[] rewardData)`][TribalChief-add-uint120-contract-IERC20-contract-IRewarder-struct-TribalChief-RewardData---]
- [`set(uint256 _pid, uint120 _allocPoint, contract IRewarder _rewarder, bool overwrite)`][TribalChief-set-uint256-uint120-contract-IRewarder-bool-]
- [`resetRewards(uint256 _pid)`][TribalChief-resetRewards-uint256-]
- [`pendingRewards(uint256 _pid, address _user)`][TribalChief-pendingRewards-uint256-address-]
- [`massUpdatePools(uint256[] pids)`][TribalChief-massUpdatePools-uint256---]
- [`tribePerBlock()`][TribalChief-tribePerBlock--]
- [`updatePool(uint256 pid)`][TribalChief-updatePool-uint256-]
- [`deposit(uint256 pid, uint256 amount, uint64 lockLength)`][TribalChief-deposit-uint256-uint256-uint64-]
- [`withdrawAllAndHarvest(uint256 pid, address to)`][TribalChief-withdrawAllAndHarvest-uint256-address-]
- [`withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index)`][TribalChief-withdrawFromDeposit-uint256-uint256-address-uint256-]
- [`harvest(uint256 pid, address to)`][TribalChief-harvest-uint256-address-]
- [`emergencyWithdraw(uint256 pid, address to)`][TribalChief-emergencyWithdraw-uint256-address-]
- [`_initialize(address)`][CoreRef-_initialize-address-]
- [`setContractAdminRole(bytes32 newContractAdminRole)`][CoreRef-setContractAdminRole-bytes32-]
- [`isContractAdmin(address _admin)`][CoreRef-isContractAdmin-address-]
- [`pause()`][CoreRef-pause--]
- [`unpause()`][CoreRef-unpause--]
- [`core()`][CoreRef-core--]
- [`fei()`][CoreRef-fei--]
- [`tribe()`][CoreRef-tribe--]
- [`feiBalance()`][CoreRef-feiBalance--]
- [`tribeBalance()`][CoreRef-tribeBalance--]
- [`_burnFeiHeld()`][CoreRef-_burnFeiHeld--]
- [`_mintFei(address to, uint256 amount)`][CoreRef-_mintFei-address-uint256-]
- [`_setContractAdminRole(bytes32 newContractAdminRole)`][CoreRef-_setContractAdminRole-bytes32-]
- [`paused()`][Pausable-paused--]
- [`_pause()`][Pausable-_pause--]
- [`_unpause()`][Pausable-_unpause--]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`CONTRACT_ADMIN_ROLE()`][ICoreRef-CONTRACT_ADMIN_ROLE--]
- [`Deposit(address user, uint256 pid, uint256 amount, uint256 depositID)`][TribalChief-Deposit-address-uint256-uint256-uint256-]
- [`Withdraw(address user, uint256 pid, uint256 amount, address to)`][TribalChief-Withdraw-address-uint256-uint256-address-]
- [`EmergencyWithdraw(address user, uint256 pid, uint256 amount, address to)`][TribalChief-EmergencyWithdraw-address-uint256-uint256-address-]
- [`Harvest(address user, uint256 pid, uint256 amount)`][TribalChief-Harvest-address-uint256-uint256-]
- [`LogPoolAddition(uint256 pid, uint256 allocPoint, contract IERC20 stakedToken, contract IRewarder rewarder)`][TribalChief-LogPoolAddition-uint256-uint256-contract-IERC20-contract-IRewarder-]
- [`LogSetPool(uint256 pid, uint256 allocPoint, contract IRewarder rewarder, bool overwrite)`][TribalChief-LogSetPool-uint256-uint256-contract-IRewarder-bool-]
- [`LogPoolMultiplier(uint256 pid, uint128 lockLength, uint256 multiplier)`][TribalChief-LogPoolMultiplier-uint256-uint128-uint256-]
- [`LogUpdatePool(uint256 pid, uint128 lastRewardBlock, uint256 lpSupply, uint256 accTribePerShare)`][TribalChief-LogUpdatePool-uint256-uint128-uint256-uint256-]
- [`TribeWithdraw(uint256 amount)`][TribalChief-TribeWithdraw-uint256-]
- [`NewTribePerBlock(uint256 amount)`][TribalChief-NewTribePerBlock-uint256-]
- [`PoolLocked(bool locked, uint256 pid)`][TribalChief-PoolLocked-bool-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="TribalChief-constructor-address-"></span> `constructor(address coreAddress)` (public)



### <span id="TribalChief-initialize-address-contract-IERC20-"></span> `initialize(address _core, contract IERC20 _tribe)` (external)



### <span id="TribalChief-updateBlockReward-uint256-"></span> `updateBlockReward(uint256 newBlockReward)` (external)



### <span id="TribalChief-lockPool-uint256-"></span> `lockPool(uint256 _pid)` (external)



### <span id="TribalChief-unlockPool-uint256-"></span> `unlockPool(uint256 _pid)` (external)



### <span id="TribalChief-governorAddPoolMultiplier-uint256-uint64-uint64-"></span> `governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier)` (external)



### <span id="TribalChief-governorWithdrawTribe-uint256-"></span> `governorWithdrawTribe(uint256 amount)` (external)



### <span id="TribalChief-numPools--"></span> `numPools() → uint256` (public)



### <span id="TribalChief-openUserDeposits-uint256-address-"></span> `openUserDeposits(uint256 pid, address user) → uint256` (public)



### <span id="TribalChief-getTotalStakedInPool-uint256-address-"></span> `getTotalStakedInPool(uint256 pid, address user) → uint256` (public)



### <span id="TribalChief-add-uint120-contract-IERC20-contract-IRewarder-struct-TribalChief-RewardData---"></span> `add(uint120 allocPoint, contract IERC20 _stakedToken, contract IRewarder _rewarder, struct TribalChief.RewardData[] rewardData)` (external)



### <span id="TribalChief-set-uint256-uint120-contract-IRewarder-bool-"></span> `set(uint256 _pid, uint120 _allocPoint, contract IRewarder _rewarder, bool overwrite)` (public)



### <span id="TribalChief-resetRewards-uint256-"></span> `resetRewards(uint256 _pid)` (public)



### <span id="TribalChief-pendingRewards-uint256-address-"></span> `pendingRewards(uint256 _pid, address _user) → uint256` (external)



### <span id="TribalChief-massUpdatePools-uint256---"></span> `massUpdatePools(uint256[] pids)` (external)



### <span id="TribalChief-tribePerBlock--"></span> `tribePerBlock() → uint256` (public)



### <span id="TribalChief-updatePool-uint256-"></span> `updatePool(uint256 pid)` (public)



### <span id="TribalChief-deposit-uint256-uint256-uint64-"></span> `deposit(uint256 pid, uint256 amount, uint64 lockLength)` (public)



### <span id="TribalChief-withdrawAllAndHarvest-uint256-address-"></span> `withdrawAllAndHarvest(uint256 pid, address to)` (external)



### <span id="TribalChief-withdrawFromDeposit-uint256-uint256-address-uint256-"></span> `withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index)` (public)



### <span id="TribalChief-harvest-uint256-address-"></span> `harvest(uint256 pid, address to)` (public)



### <span id="TribalChief-emergencyWithdraw-uint256-address-"></span> `emergencyWithdraw(uint256 pid, address to)` (public)



### <span id="TribalChief-Deposit-address-uint256-uint256-uint256-"></span> `Deposit(address user, uint256 pid, uint256 amount, uint256 depositID)`



### <span id="TribalChief-Withdraw-address-uint256-uint256-address-"></span> `Withdraw(address user, uint256 pid, uint256 amount, address to)`



### <span id="TribalChief-EmergencyWithdraw-address-uint256-uint256-address-"></span> `EmergencyWithdraw(address user, uint256 pid, uint256 amount, address to)`



### <span id="TribalChief-Harvest-address-uint256-uint256-"></span> `Harvest(address user, uint256 pid, uint256 amount)`



### <span id="TribalChief-LogPoolAddition-uint256-uint256-contract-IERC20-contract-IRewarder-"></span> `LogPoolAddition(uint256 pid, uint256 allocPoint, contract IERC20 stakedToken, contract IRewarder rewarder)`



### <span id="TribalChief-LogSetPool-uint256-uint256-contract-IRewarder-bool-"></span> `LogSetPool(uint256 pid, uint256 allocPoint, contract IRewarder rewarder, bool overwrite)`



### <span id="TribalChief-LogPoolMultiplier-uint256-uint128-uint256-"></span> `LogPoolMultiplier(uint256 pid, uint128 lockLength, uint256 multiplier)`



### <span id="TribalChief-LogUpdatePool-uint256-uint128-uint256-uint256-"></span> `LogUpdatePool(uint256 pid, uint128 lastRewardBlock, uint256 lpSupply, uint256 accTribePerShare)`



### <span id="TribalChief-TribeWithdraw-uint256-"></span> `TribeWithdraw(uint256 amount)`



### <span id="TribalChief-NewTribePerBlock-uint256-"></span> `NewTribePerBlock(uint256 amount)`



### <span id="TribalChief-PoolLocked-bool-uint256-"></span> `PoolLocked(bool locked, uint256 pid)`



