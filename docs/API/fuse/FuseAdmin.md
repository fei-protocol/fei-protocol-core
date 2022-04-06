## <span id="FuseAdmin"></span> `FuseAdmin`



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
- [`constructor(address _core, contract Unitroller _comptroller)`][FuseAdmin-constructor-address-contract-Unitroller-]
- [`oracleAdd(address[] underlyings, address[] _oracles)`][FuseAdmin-oracleAdd-address---address---]
- [`oracleChangeAdmin(address newAdmin)`][FuseAdmin-oracleChangeAdmin-address-]
- [`_addRewardsDistributor(address distributor)`][FuseAdmin-_addRewardsDistributor-address-]
- [`_setWhitelistEnforcement(bool enforce)`][FuseAdmin-_setWhitelistEnforcement-bool-]
- [`_setWhitelistStatuses(address[] suppliers, bool[] statuses)`][FuseAdmin-_setWhitelistStatuses-address---bool---]
- [`_setPriceOracle(address newOracle)`][FuseAdmin-_setPriceOracle-address-]
- [`_setCloseFactor(uint256 newCloseFactorMantissa)`][FuseAdmin-_setCloseFactor-uint256-]
- [`_setCollateralFactor(contract CToken cToken, uint256 newCollateralFactorMantissa)`][FuseAdmin-_setCollateralFactor-contract-CToken-uint256-]
- [`_setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa)`][FuseAdmin-_setLiquidationIncentive-uint256-]
- [`_deployMarket(address underlying, address irm, string name, string symbol, address impl, bytes data, uint256 reserveFactor, uint256 adminFee, uint256 collateralFactorMantissa)`][FuseAdmin-_deployMarket-address-address-string-string-address-bytes-uint256-uint256-uint256-]
- [`_unsupportMarket(contract CToken cToken)`][FuseAdmin-_unsupportMarket-contract-CToken-]
- [`_toggleAutoImplementations(bool enabled)`][FuseAdmin-_toggleAutoImplementations-bool-]
- [`_setPendingAdmin(address newPendingAdmin)`][FuseAdmin-_setPendingAdmin-address-]
- [`_acceptAdmin()`][FuseAdmin-_acceptAdmin--]
- [`_setMarketSupplyCaps(contract CToken[] cTokens, uint256[] newSupplyCaps)`][FuseGuardian-_setMarketSupplyCaps-contract-CToken---uint256---]
- [`_setMarketSupplyCapsByUnderlying(address[] underlyings, uint256[] newSupplyCaps)`][FuseGuardian-_setMarketSupplyCapsByUnderlying-address---uint256---]
- [`_setMarketSupplyCapsInternal(contract CToken[] cTokens, uint256[] newSupplyCaps)`][FuseGuardian-_setMarketSupplyCapsInternal-contract-CToken---uint256---]
- [`_underlyingToCTokens(address[] underlyings)`][FuseGuardian-_underlyingToCTokens-address---]
- [`_setMarketBorrowCaps(contract CToken[] cTokens, uint256[] newBorrowCaps)`][FuseGuardian-_setMarketBorrowCaps-contract-CToken---uint256---]
- [`_setMarketBorrowCapsInternal(contract CToken[] cTokens, uint256[] newBorrowCaps)`][FuseGuardian-_setMarketBorrowCapsInternal-contract-CToken---uint256---]
- [`_setMarketBorrowCapsByUnderlying(address[] underlyings, uint256[] newBorrowCaps)`][FuseGuardian-_setMarketBorrowCapsByUnderlying-address---uint256---]
- [`_setBorrowCapGuardian(address newBorrowCapGuardian)`][FuseGuardian-_setBorrowCapGuardian-address-]
- [`_setPauseGuardian(address newPauseGuardian)`][FuseGuardian-_setPauseGuardian-address-]
- [`_setMintPausedByUnderlying(address underlying, bool state)`][FuseGuardian-_setMintPausedByUnderlying-address-bool-]
- [`_setMintPaused(contract CToken cToken, bool state)`][FuseGuardian-_setMintPaused-contract-CToken-bool-]
- [`_setMintPausedInternal(contract CToken cToken, bool state)`][FuseGuardian-_setMintPausedInternal-contract-CToken-bool-]
- [`_setBorrowPausedByUnderlying(address underlying, bool state)`][FuseGuardian-_setBorrowPausedByUnderlying-address-bool-]
- [`_setBorrowPausedInternal(contract CToken cToken, bool state)`][FuseGuardian-_setBorrowPausedInternal-contract-CToken-bool-]
- [`_setBorrowPaused(contract CToken cToken, bool state)`][FuseGuardian-_setBorrowPaused-contract-CToken-bool-]
- [`_setTransferPaused(bool state)`][FuseGuardian-_setTransferPaused-bool-]
- [`_setSeizePaused(bool state)`][FuseGuardian-_setSeizePaused-bool-]
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
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="FuseAdmin-constructor-address-contract-Unitroller-"></span> `constructor(address _core, contract Unitroller _comptroller)` (public)



### <span id="FuseAdmin-oracleAdd-address---address---"></span> `oracleAdd(address[] underlyings, address[] _oracles)` (external)



### <span id="FuseAdmin-oracleChangeAdmin-address-"></span> `oracleChangeAdmin(address newAdmin)` (external)



### <span id="FuseAdmin-_addRewardsDistributor-address-"></span> `_addRewardsDistributor(address distributor)` (external)



### <span id="FuseAdmin-_setWhitelistEnforcement-bool-"></span> `_setWhitelistEnforcement(bool enforce)` (external)



### <span id="FuseAdmin-_setWhitelistStatuses-address---bool---"></span> `_setWhitelistStatuses(address[] suppliers, bool[] statuses)` (external)



### <span id="FuseAdmin-_setPriceOracle-address-"></span> `_setPriceOracle(address newOracle)` (public)



### <span id="FuseAdmin-_setCloseFactor-uint256-"></span> `_setCloseFactor(uint256 newCloseFactorMantissa)` (external)



### <span id="FuseAdmin-_setCollateralFactor-contract-CToken-uint256-"></span> `_setCollateralFactor(contract CToken cToken, uint256 newCollateralFactorMantissa)` (public)



### <span id="FuseAdmin-_setLiquidationIncentive-uint256-"></span> `_setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa)` (external)



### <span id="FuseAdmin-_deployMarket-address-address-string-string-address-bytes-uint256-uint256-uint256-"></span> `_deployMarket(address underlying, address irm, string name, string symbol, address impl, bytes data, uint256 reserveFactor, uint256 adminFee, uint256 collateralFactorMantissa)` (external)



### <span id="FuseAdmin-_unsupportMarket-contract-CToken-"></span> `_unsupportMarket(contract CToken cToken)` (external)



### <span id="FuseAdmin-_toggleAutoImplementations-bool-"></span> `_toggleAutoImplementations(bool enabled)` (public)



### <span id="FuseAdmin-_setPendingAdmin-address-"></span> `_setPendingAdmin(address newPendingAdmin)` (public)



### <span id="FuseAdmin-_acceptAdmin--"></span> `_acceptAdmin()` (public)



