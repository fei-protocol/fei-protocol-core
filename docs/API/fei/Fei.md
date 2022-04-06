## <span id="Fei"></span> `Fei`



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
- [`constructor(address core)`][Fei-constructor-address-]
- [`setIncentiveContract(address account, address incentive)`][Fei-setIncentiveContract-address-address-]
- [`mint(address account, uint256 amount)`][Fei-mint-address-uint256-]
- [`burn(uint256 amount)`][Fei-burn-uint256-]
- [`burnFrom(address account, uint256 amount)`][Fei-burnFrom-address-uint256-]
- [`_transfer(address sender, address recipient, uint256 amount)`][Fei-_transfer-address-address-uint256-]
- [`_checkAndApplyIncentives(address sender, address recipient, uint256 amount)`][Fei-_checkAndApplyIncentives-address-address-uint256-]
- [`permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`][Fei-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-]
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
- [`name()`][ERC20-name--]
- [`symbol()`][ERC20-symbol--]
- [`decimals()`][ERC20-decimals--]
- [`totalSupply()`][ERC20-totalSupply--]
- [`balanceOf(address account)`][ERC20-balanceOf-address-]
- [`transfer(address to, uint256 amount)`][ERC20-transfer-address-uint256-]
- [`allowance(address owner, address spender)`][ERC20-allowance-address-address-]
- [`approve(address spender, uint256 amount)`][ERC20-approve-address-uint256-]
- [`transferFrom(address from, address to, uint256 amount)`][ERC20-transferFrom-address-address-uint256-]
- [`increaseAllowance(address spender, uint256 addedValue)`][ERC20-increaseAllowance-address-uint256-]
- [`decreaseAllowance(address spender, uint256 subtractedValue)`][ERC20-decreaseAllowance-address-uint256-]
- [`_mint(address account, uint256 amount)`][ERC20-_mint-address-uint256-]
- [`_burn(address account, uint256 amount)`][ERC20-_burn-address-uint256-]
- [`_approve(address owner, address spender, uint256 amount)`][ERC20-_approve-address-address-uint256-]
- [`_spendAllowance(address owner, address spender, uint256 amount)`][ERC20-_spendAllowance-address-address-uint256-]
- [`_beforeTokenTransfer(address from, address to, uint256 amount)`][ERC20-_beforeTokenTransfer-address-address-uint256-]
- [`_afterTokenTransfer(address from, address to, uint256 amount)`][ERC20-_afterTokenTransfer-address-address-uint256-]
- [`incentiveContract(address account)`][IFei-incentiveContract-address-]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`CONTRACT_ADMIN_ROLE()`][ICoreRef-CONTRACT_ADMIN_ROLE--]
- [`Paused(address account)`][Pausable-Paused-address-]
- [`Unpaused(address account)`][Pausable-Unpaused-address-]
- [`Minting(address _to, address _minter, uint256 _amount)`][IFei-Minting-address-address-uint256-]
- [`Burning(address _to, address _burner, uint256 _amount)`][IFei-Burning-address-address-uint256-]
- [`IncentiveContractUpdate(address _incentivized, address _incentiveContract)`][IFei-IncentiveContractUpdate-address-address-]
- [`Transfer(address from, address to, uint256 value)`][IERC20-Transfer-address-address-uint256-]
- [`Approval(address owner, address spender, uint256 value)`][IERC20-Approval-address-address-uint256-]
- [`CoreUpdate(address oldCore, address newCore)`][ICoreRef-CoreUpdate-address-address-]
- [`ContractAdminRoleUpdate(bytes32 oldContractAdminRole, bytes32 newContractAdminRole)`][ICoreRef-ContractAdminRoleUpdate-bytes32-bytes32-]
### <span id="Fei-constructor-address-"></span> `constructor(address core)` (public)



### <span id="Fei-setIncentiveContract-address-address-"></span> `setIncentiveContract(address account, address incentive)` (external)



### <span id="Fei-mint-address-uint256-"></span> `mint(address account, uint256 amount)` (external)



### <span id="Fei-burn-uint256-"></span> `burn(uint256 amount)` (public)



### <span id="Fei-burnFrom-address-uint256-"></span> `burnFrom(address account, uint256 amount)` (public)



### <span id="Fei-_transfer-address-address-uint256-"></span> `_transfer(address sender, address recipient, uint256 amount)` (internal)



### <span id="Fei-_checkAndApplyIncentives-address-address-uint256-"></span> `_checkAndApplyIncentives(address sender, address recipient, uint256 amount)` (internal)



### <span id="Fei-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-"></span> `permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (external)



