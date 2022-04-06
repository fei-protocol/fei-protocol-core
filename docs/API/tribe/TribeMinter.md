## <span id="TribeMinter"></span> `TribeMinter`



- [`onlyOwner()`][Ownable-onlyOwner--]
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
- [`constructor(address _core, uint256 _annualMaxInflationBasisPoints, address _owner, address _tribeTreasury, address _tribeRewardsDripper)`][TribeMinter-constructor-address-uint256-address-address-address-]
- [`poke()`][TribeMinter-poke--]
- [`setRateLimitPerSecond(uint256)`][TribeMinter-setRateLimitPerSecond-uint256-]
- [`setBufferCap(uint256)`][TribeMinter-setBufferCap-uint256-]
- [`mint(address to, uint256 amount)`][TribeMinter-mint-address-uint256-]
- [`setTribeTreasury(address newTribeTreasury)`][TribeMinter-setTribeTreasury-address-]
- [`setTribeRewardsDripper(address newTribeRewardsDripper)`][TribeMinter-setTribeRewardsDripper-address-]
- [`setMinter(address newMinter)`][TribeMinter-setMinter-address-]
- [`setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)`][TribeMinter-setAnnualMaxInflationBasisPoints-uint256-]
- [`idealBufferCap()`][TribeMinter-idealBufferCap--]
- [`tribeCirculatingSupply()`][TribeMinter-tribeCirculatingSupply--]
- [`totalSupply()`][TribeMinter-totalSupply--]
- [`isPokeNeeded()`][TribeMinter-isPokeNeeded--]
- [`_mint(address to, uint256 amount)`][TribeMinter-_mint-address-uint256-]
- [`_setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)`][TribeMinter-_setAnnualMaxInflationBasisPoints-uint256-]
- [`owner()`][Ownable-owner--]
- [`renounceOwnership()`][Ownable-renounceOwnership--]
- [`transferOwnership(address newOwner)`][Ownable-transferOwnership-address-]
- [`_transferOwnership(address newOwner)`][Ownable-_transferOwnership-address-]
- [`buffer()`][RateLimited-buffer--]
- [`_depleteBuffer(uint256 amount)`][RateLimited-_depleteBuffer-uint256-]
- [`_setRateLimitPerSecond(uint256 newRateLimitPerSecond)`][RateLimited-_setRateLimitPerSecond-uint256-]
- [`_setBufferCap(uint256 newBufferCap)`][RateLimited-_setBufferCap-uint256-]
- [`_resetBuffer()`][RateLimited-_resetBuffer--]
- [`_updateBufferStored()`][RateLimited-_updateBufferStored--]
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
- [`annualMaxInflationBasisPoints()`][ITribeMinter-annualMaxInflationBasisPoints--]
- [`tribeTreasury()`][ITribeMinter-tribeTreasury--]
- [`tribeRewardsDripper()`][ITribeMinter-tribeRewardsDripper--]
- [`OwnershipTransferred(address previousOwner, address newOwner)`][Ownable-OwnershipTransferred-address-address-]
- [`BufferUsed(uint256 amountUsed, uint256 bufferRemaining)`][RateLimited-BufferUsed-uint256-uint256-]
- [`BufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap)`][RateLimited-BufferCapUpdate-uint256-uint256-]
- [`RateLimitPerSecondUpdate(uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond)`][RateLimited-RateLimitPerSecondUpdate-uint256-uint256-]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
- [`AnnualMaxInflationUpdate(uint256 oldAnnualMaxInflationBasisPoints, uint256 newAnnualMaxInflationBasisPoints)`][ITribeMinter-AnnualMaxInflationUpdate-uint256-uint256-]
- [`TribeTreasuryUpdate(address oldTribeTreasury, address newTribeTreasury)`][ITribeMinter-TribeTreasuryUpdate-address-address-]
- [`TribeRewardsDripperUpdate(address oldTribeRewardsDripper, address newTribeRewardsDripper)`][ITribeMinter-TribeRewardsDripperUpdate-address-address-]
### <span id="TribeMinter-constructor-address-uint256-address-address-address-"></span> `constructor(address _core, uint256 _annualMaxInflationBasisPoints, address _owner, address _tribeTreasury, address _tribeRewardsDripper)` (public)



### <span id="TribeMinter-poke--"></span> `poke()` (public)



### <span id="TribeMinter-setRateLimitPerSecond-uint256-"></span> `setRateLimitPerSecond(uint256)` (external)

no-op, reverts. Prevent admin or governor from overwriting ideal rate limit

### <span id="TribeMinter-setBufferCap-uint256-"></span> `setBufferCap(uint256)` (external)

no-op, reverts. Prevent admin or governor from overwriting ideal buffer cap

### <span id="TribeMinter-mint-address-uint256-"></span> `mint(address to, uint256 amount)` (external)



### <span id="TribeMinter-setTribeTreasury-address-"></span> `setTribeTreasury(address newTribeTreasury)` (external)



### <span id="TribeMinter-setTribeRewardsDripper-address-"></span> `setTribeRewardsDripper(address newTribeRewardsDripper)` (external)



### <span id="TribeMinter-setMinter-address-"></span> `setMinter(address newMinter)` (external)



### <span id="TribeMinter-setAnnualMaxInflationBasisPoints-uint256-"></span> `setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)` (external)



### <span id="TribeMinter-idealBufferCap--"></span> `idealBufferCap() → uint256` (public)



### <span id="TribeMinter-tribeCirculatingSupply--"></span> `tribeCirculatingSupply() → uint256` (public)



### <span id="TribeMinter-totalSupply--"></span> `totalSupply() → uint256` (public)

for compatibility with ERC-20 standard for off-chain 3rd party sites

### <span id="TribeMinter-isPokeNeeded--"></span> `isPokeNeeded() → bool` (external)



### <span id="TribeMinter-_mint-address-uint256-"></span> `_mint(address to, uint256 amount)` (internal)



### <span id="TribeMinter-_setAnnualMaxInflationBasisPoints-uint256-"></span> `_setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)` (internal)



