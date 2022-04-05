## <span id="AutoRewardsDistributorV2"></span> `AutoRewardsDistributorV2`



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
- [`constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorAdmin, contract ITribalChief _tribalChief, contract StakingTokenWrapper _stakedTokenWrapper, address _underlying, bool _isBorrowIncentivized, contract Unitroller _comptroller)`][AutoRewardsDistributorV2-constructor-address-contract-IRewardsDistributorAdmin-contract-ITribalChief-contract-StakingTokenWrapper-address-bool-contract-Unitroller-]
- [`init()`][AutoRewardsDistributorV2-init--]
- [`_deriveRequiredCompSpeed()`][AutoRewardsDistributorV2-_deriveRequiredCompSpeed--]
- [`getNewRewardSpeed()`][AutoRewardsDistributorV2-getNewRewardSpeed--]
- [`setAutoRewardsDistribution()`][AutoRewardsDistributorV2-setAutoRewardsDistribution--]
- [`setRewardsDistributorAdmin(contract IRewardsDistributorAdmin _newRewardsDistributorAdmin)`][AutoRewardsDistributorV2-setRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-]
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
- [`SpeedChanged(uint256 newSpeed)`][AutoRewardsDistributorV2-SpeedChanged-uint256-]
- [`RewardsDistributorAdminChanged(contract IRewardsDistributorAdmin oldRewardsDistributorAdmin, contract IRewardsDistributorAdmin newRewardsDistributorAdmin)`][AutoRewardsDistributorV2-RewardsDistributorAdminChanged-contract-IRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="AutoRewardsDistributorV2-constructor-address-contract-IRewardsDistributorAdmin-contract-ITribalChief-contract-StakingTokenWrapper-address-bool-contract-Unitroller-"></span> `constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorAdmin, contract ITribalChief _tribalChief, contract StakingTokenWrapper _stakedTokenWrapper, address _underlying, bool _isBorrowIncentivized, contract Unitroller _comptroller)` (public)



### <span id="AutoRewardsDistributorV2-init--"></span> `init()` (external)



### <span id="AutoRewardsDistributorV2-_deriveRequiredCompSpeed--"></span> `_deriveRequiredCompSpeed() → uint256 compSpeed` (internal)



### <span id="AutoRewardsDistributorV2-getNewRewardSpeed--"></span> `getNewRewardSpeed() → uint256 newCompSpeed, bool updateNeeded` (public)



### <span id="AutoRewardsDistributorV2-setAutoRewardsDistribution--"></span> `setAutoRewardsDistribution()` (external)



### <span id="AutoRewardsDistributorV2-setRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-"></span> `setRewardsDistributorAdmin(contract IRewardsDistributorAdmin _newRewardsDistributorAdmin)` (external)



### <span id="AutoRewardsDistributorV2-SpeedChanged-uint256-"></span> `SpeedChanged(uint256 newSpeed)`



### <span id="AutoRewardsDistributorV2-RewardsDistributorAdminChanged-contract-IRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-"></span> `RewardsDistributorAdminChanged(contract IRewardsDistributorAdmin oldRewardsDistributorAdmin, contract IRewardsDistributorAdmin newRewardsDistributorAdmin)`



