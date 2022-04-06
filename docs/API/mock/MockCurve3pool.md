## <span id="MockCurve3pool"></span> `MockCurve3pool`



- [`constructor(address _dai, address _usdc, address _usdt)`][MockCurve3pool-constructor-address-address-address-]
- [`set_slippage(uint256 _slippage)`][MockCurve3pool-set_slippage-uint256-]
- [`add_liquidity(uint256[3] amounts, uint256 min_mint_amount)`][MockCurve3pool-add_liquidity-uint256-3--uint256-]
- [`balances(uint256 i)`][MockCurve3pool-balances-uint256-]
- [`remove_liquidity(uint256 _amount, uint256[3] min_amounts)`][MockCurve3pool-remove_liquidity-uint256-uint256-3--]
- [`remove_liquidity_one_coin(uint256 _amount, int128 i, uint256 min_amount)`][MockCurve3pool-remove_liquidity_one_coin-uint256-int128-uint256-]
- [`get_virtual_price()`][MockCurve3pool-get_virtual_price--]
- [`calc_withdraw_one_coin(uint256 _token_amount, int128 i)`][MockCurve3pool-calc_withdraw_one_coin-uint256-int128-]
- [`mint(address account, uint256 amount)`][MockERC20-mint-address-uint256-]
- [`mockBurn(address account, uint256 amount)`][MockERC20-mockBurn-address-uint256-]
- [`approveOverride(address owner, address spender, uint256 amount)`][MockERC20-approveOverride-address-address-uint256-]
- [`burn(uint256 amount)`][ERC20Burnable-burn-uint256-]
- [`burnFrom(address account, uint256 amount)`][ERC20Burnable-burnFrom-address-uint256-]
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
- [`_transfer(address from, address to, uint256 amount)`][ERC20-_transfer-address-address-uint256-]
- [`_mint(address account, uint256 amount)`][ERC20-_mint-address-uint256-]
- [`_burn(address account, uint256 amount)`][ERC20-_burn-address-uint256-]
- [`_approve(address owner, address spender, uint256 amount)`][ERC20-_approve-address-address-uint256-]
- [`_spendAllowance(address owner, address spender, uint256 amount)`][ERC20-_spendAllowance-address-address-uint256-]
- [`_beforeTokenTransfer(address from, address to, uint256 amount)`][ERC20-_beforeTokenTransfer-address-address-uint256-]
- [`_afterTokenTransfer(address from, address to, uint256 amount)`][ERC20-_afterTokenTransfer-address-address-uint256-]
- [`_msgSender()`][Context-_msgSender--]
- [`_msgData()`][Context-_msgData--]
- [`Transfer(address from, address to, uint256 value)`][IERC20-Transfer-address-address-uint256-]
- [`Approval(address owner, address spender, uint256 value)`][IERC20-Approval-address-address-uint256-]
### <span id="MockCurve3pool-constructor-address-address-address-"></span> `constructor(address _dai, address _usdc, address _usdt)` (public)



### <span id="MockCurve3pool-set_slippage-uint256-"></span> `set_slippage(uint256 _slippage)` (public)



### <span id="MockCurve3pool-add_liquidity-uint256-3--uint256-"></span> `add_liquidity(uint256[3] amounts, uint256 min_mint_amount)` (public)



### <span id="MockCurve3pool-balances-uint256-"></span> `balances(uint256 i) → uint256` (public)



### <span id="MockCurve3pool-remove_liquidity-uint256-uint256-3--"></span> `remove_liquidity(uint256 _amount, uint256[3] min_amounts)` (public)



### <span id="MockCurve3pool-remove_liquidity_one_coin-uint256-int128-uint256-"></span> `remove_liquidity_one_coin(uint256 _amount, int128 i, uint256 min_amount)` (public)



### <span id="MockCurve3pool-get_virtual_price--"></span> `get_virtual_price() → uint256` (public)



### <span id="MockCurve3pool-calc_withdraw_one_coin-uint256-int128-"></span> `calc_withdraw_one_coin(uint256 _token_amount, int128 i) → uint256` (public)



