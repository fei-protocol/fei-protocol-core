## <span id="AutoRewardsDistributor"></span> `AutoRewardsDistributor`



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
- [`constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorAdmin, contract ITribalChief _tribalChief, uint256 _tribalChiefRewardIndex, address _cTokenAddress, bool _isBorrowIncentivized)`][AutoRewardsDistributor-constructor-address-contract-IRewardsDistributorAdmin-contract-ITribalChief-uint256-address-bool-]
- [`_deriveRequiredCompSpeed()`][AutoRewardsDistributor-_deriveRequiredCompSpeed--]
- [`getNewRewardSpeed()`][AutoRewardsDistributor-getNewRewardSpeed--]
- [`setAutoRewardsDistribution()`][AutoRewardsDistributor-setAutoRewardsDistribution--]
- [`setRewardsDistributorAdmin(contract IRewardsDistributorAdmin _newRewardsDistributorAdmin)`][AutoRewardsDistributor-setRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-]
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
- [`SpeedChanged(uint256 newSpeed)`][AutoRewardsDistributor-SpeedChanged-uint256-]
- [`RewardsDistributorAdminChanged(contract IRewardsDistributorAdmin oldRewardsDistributorAdmin, contract IRewardsDistributorAdmin newRewardsDistributorAdmin)`][AutoRewardsDistributor-RewardsDistributorAdminChanged-contract-IRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="AutoRewardsDistributor-constructor-address-contract-IRewardsDistributorAdmin-contract-ITribalChief-uint256-address-bool-"></span> `constructor(address coreAddress, contract IRewardsDistributorAdmin _rewardsDistributorAdmin, contract ITribalChief _tribalChief, uint256 _tribalChiefRewardIndex, address _cTokenAddress, bool _isBorrowIncentivized)` (public)



### <span id="AutoRewardsDistributor-_deriveRequiredCompSpeed--"></span> `_deriveRequiredCompSpeed() → uint256 compSpeed` (internal)



### <span id="AutoRewardsDistributor-getNewRewardSpeed--"></span> `getNewRewardSpeed() → uint256 newCompSpeed, bool updateNeeded` (public)



### <span id="AutoRewardsDistributor-setAutoRewardsDistribution--"></span> `setAutoRewardsDistribution()` (external)



### <span id="AutoRewardsDistributor-setRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-"></span> `setRewardsDistributorAdmin(contract IRewardsDistributorAdmin _newRewardsDistributorAdmin)` (external)



### <span id="AutoRewardsDistributor-SpeedChanged-uint256-"></span> `SpeedChanged(uint256 newSpeed)`



### <span id="AutoRewardsDistributor-RewardsDistributorAdminChanged-contract-IRewardsDistributorAdmin-contract-IRewardsDistributorAdmin-"></span> `RewardsDistributorAdminChanged(contract IRewardsDistributorAdmin oldRewardsDistributorAdmin, contract IRewardsDistributorAdmin newRewardsDistributorAdmin)`



