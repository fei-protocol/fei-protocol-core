## <span id="RatioPCVControllerV2"></span> `RatioPCVControllerV2`



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
- [`constructor(address _core)`][RatioPCVControllerV2-constructor-address-]
- [`receive()`][RatioPCVControllerV2-receive--]
- [`withdrawRatio(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)`][RatioPCVControllerV2-withdrawRatio-contract-IPCVDeposit-address-uint256-]
- [`withdrawRatioUnwrapWETH(contract IPCVDeposit pcvDeposit, address payable to, uint256 basisPoints)`][RatioPCVControllerV2-withdrawRatioUnwrapWETH-contract-IPCVDeposit-address-payable-uint256-]
- [`withdrawRatioWrapETH(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)`][RatioPCVControllerV2-withdrawRatioWrapETH-contract-IPCVDeposit-address-uint256-]
- [`withdrawUnwrapWETH(contract IPCVDeposit pcvDeposit, address payable to, uint256 amount)`][RatioPCVControllerV2-withdrawUnwrapWETH-contract-IPCVDeposit-address-payable-uint256-]
- [`withdrawWrapETH(contract IPCVDeposit pcvDeposit, address to, uint256 amount)`][RatioPCVControllerV2-withdrawWrapETH-contract-IPCVDeposit-address-uint256-]
- [`withdrawRatioERC20(contract IPCVDeposit pcvDeposit, address token, address to, uint256 basisPoints)`][RatioPCVControllerV2-withdrawRatioERC20-contract-IPCVDeposit-address-address-uint256-]
- [`transferFromRatio(address from, contract IERC20 token, address to, uint256 basisPoints)`][RatioPCVControllerV2-transferFromRatio-address-contract-IERC20-address-uint256-]
- [`transferFrom(address from, contract IERC20 token, address to, uint256 amount)`][RatioPCVControllerV2-transferFrom-address-contract-IERC20-address-uint256-]
- [`transferETHAsWETH(address to)`][RatioPCVControllerV2-transferETHAsWETH-address-]
- [`transferWETHAsETH(address payable to)`][RatioPCVControllerV2-transferWETHAsETH-address-payable-]
- [`transferERC20(contract IERC20 token, address to)`][RatioPCVControllerV2-transferERC20-contract-IERC20-address-]
- [`_withdrawRatio(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)`][RatioPCVControllerV2-_withdrawRatio-contract-IPCVDeposit-address-uint256-]
- [`_transferETHAsWETH(address to, uint256 amount)`][RatioPCVControllerV2-_transferETHAsWETH-address-uint256-]
- [`_transferWETHAsETH(address payable to, uint256 amount)`][RatioPCVControllerV2-_transferWETHAsETH-address-payable-uint256-]
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
### <span id="RatioPCVControllerV2-constructor-address-"></span> `constructor(address _core)` (public)



### <span id="RatioPCVControllerV2-receive--"></span> `receive()` (external)



### <span id="RatioPCVControllerV2-withdrawRatio-contract-IPCVDeposit-address-uint256-"></span> `withdrawRatio(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)` (public)



### <span id="RatioPCVControllerV2-withdrawRatioUnwrapWETH-contract-IPCVDeposit-address-payable-uint256-"></span> `withdrawRatioUnwrapWETH(contract IPCVDeposit pcvDeposit, address payable to, uint256 basisPoints)` (public)



### <span id="RatioPCVControllerV2-withdrawRatioWrapETH-contract-IPCVDeposit-address-uint256-"></span> `withdrawRatioWrapETH(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)` (public)



### <span id="RatioPCVControllerV2-withdrawUnwrapWETH-contract-IPCVDeposit-address-payable-uint256-"></span> `withdrawUnwrapWETH(contract IPCVDeposit pcvDeposit, address payable to, uint256 amount)` (public)



### <span id="RatioPCVControllerV2-withdrawWrapETH-contract-IPCVDeposit-address-uint256-"></span> `withdrawWrapETH(contract IPCVDeposit pcvDeposit, address to, uint256 amount)` (public)



### <span id="RatioPCVControllerV2-withdrawRatioERC20-contract-IPCVDeposit-address-address-uint256-"></span> `withdrawRatioERC20(contract IPCVDeposit pcvDeposit, address token, address to, uint256 basisPoints)` (public)



### <span id="RatioPCVControllerV2-transferFromRatio-address-contract-IERC20-address-uint256-"></span> `transferFromRatio(address from, contract IERC20 token, address to, uint256 basisPoints)` (public)



### <span id="RatioPCVControllerV2-transferFrom-address-contract-IERC20-address-uint256-"></span> `transferFrom(address from, contract IERC20 token, address to, uint256 amount)` (public)



### <span id="RatioPCVControllerV2-transferETHAsWETH-address-"></span> `transferETHAsWETH(address to)` (public)



### <span id="RatioPCVControllerV2-transferWETHAsETH-address-payable-"></span> `transferWETHAsETH(address payable to)` (public)



### <span id="RatioPCVControllerV2-transferERC20-contract-IERC20-address-"></span> `transferERC20(contract IERC20 token, address to)` (public)



### <span id="RatioPCVControllerV2-_withdrawRatio-contract-IPCVDeposit-address-uint256-"></span> `_withdrawRatio(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints) → uint256` (internal)



### <span id="RatioPCVControllerV2-_transferETHAsWETH-address-uint256-"></span> `_transferETHAsWETH(address to, uint256 amount)` (internal)



### <span id="RatioPCVControllerV2-_transferWETHAsETH-address-payable-uint256-"></span> `_transferWETHAsETH(address payable to, uint256 amount)` (internal)



