## <span id="MockUniswapV2PairLiquidity"></span> `MockUniswapV2PairLiquidity`



- [`constructor(address _token0, address _token1)`][MockUniswapV2PairLiquidity-constructor-address-address-]
- [`getReserves()`][MockUniswapV2PairLiquidity-getReserves--]
- [`mint(address to)`][MockUniswapV2PairLiquidity-mint-address-]
- [`mintAmount(address to, uint256 _liquidity)`][MockUniswapV2PairLiquidity-mintAmount-address-uint256-]
- [`set(uint112 newReserve0, uint112 newReserve1, uint256 newLiquidity)`][MockUniswapV2PairLiquidity-set-uint112-uint112-uint256-]
- [`setReserves(uint112 newReserve0, uint112 newReserve1)`][MockUniswapV2PairLiquidity-setReserves-uint112-uint112-]
- [`faucet(address account, uint256 amount)`][MockUniswapV2PairLiquidity-faucet-address-uint256-]
- [`burnEth(address to, struct Decimal.D256 ratio)`][MockUniswapV2PairLiquidity-burnEth-address-struct-Decimal-D256-]
- [`withdrawFei(address to, uint256 amount)`][MockUniswapV2PairLiquidity-withdrawFei-address-uint256-]
- [`burnToken(address to, struct Decimal.D256 ratio)`][MockUniswapV2PairLiquidity-burnToken-address-struct-Decimal-D256-]
- [`swap(uint256 amount0Out, uint256 amount1Out, address to, bytes)`][MockUniswapV2PairLiquidity-swap-uint256-uint256-address-bytes-]
- [`sync()`][MockUniswapV2PairLiquidity-sync--]
- [`totalSupply()`][MockUniswapV2PairLiquidity-totalSupply--]
- [`balanceOf(address account)`][MockUniswapV2PairLiquidity-balanceOf-address-]
- [`transfer(address recipient, uint256 amount)`][MockUniswapV2PairLiquidity-transfer-address-uint256-]
- [`allowance(address owner, address spender)`][MockUniswapV2PairLiquidity-allowance-address-address-]
- [`approve(address spender, uint256 amount)`][MockUniswapV2PairLiquidity-approve-address-uint256-]
- [`transferFrom(address sender, address recipient, uint256 amount)`][MockUniswapV2PairLiquidity-transferFrom-address-address-uint256-]
- [`increaseAllowance(address spender, uint256 addedValue)`][MockUniswapV2PairLiquidity-increaseAllowance-address-uint256-]
- [`decreaseAllowance(address spender, uint256 subtractedValue)`][MockUniswapV2PairLiquidity-decreaseAllowance-address-uint256-]
- [`_transfer(address sender, address recipient, uint256 amount)`][MockUniswapV2PairLiquidity-_transfer-address-address-uint256-]
- [`_mint(address account, uint256 amount)`][MockUniswapV2PairLiquidity-_mint-address-uint256-]
- [`_burn(address account, uint256 amount)`][MockUniswapV2PairLiquidity-_burn-address-uint256-]
- [`_approve(address owner, address spender, uint256 amount)`][MockUniswapV2PairLiquidity-_approve-address-address-uint256-]
- [`_burnFrom(address account, uint256 amount)`][MockUniswapV2PairLiquidity-_burnFrom-address-uint256-]
### <span id="MockUniswapV2PairLiquidity-constructor-address-address-"></span> `constructor(address _token0, address _token1)` (public)



### <span id="MockUniswapV2PairLiquidity-getReserves--"></span> `getReserves() → uint112, uint112, uint32` (external)



### <span id="MockUniswapV2PairLiquidity-mint-address-"></span> `mint(address to) → uint256` (public)



### <span id="MockUniswapV2PairLiquidity-mintAmount-address-uint256-"></span> `mintAmount(address to, uint256 _liquidity)` (public)



### <span id="MockUniswapV2PairLiquidity-set-uint112-uint112-uint256-"></span> `set(uint112 newReserve0, uint112 newReserve1, uint256 newLiquidity)` (external)



### <span id="MockUniswapV2PairLiquidity-setReserves-uint112-uint112-"></span> `setReserves(uint112 newReserve0, uint112 newReserve1)` (external)



### <span id="MockUniswapV2PairLiquidity-faucet-address-uint256-"></span> `faucet(address account, uint256 amount) → bool` (external)



### <span id="MockUniswapV2PairLiquidity-burnEth-address-struct-Decimal-D256-"></span> `burnEth(address to, struct Decimal.D256 ratio) → uint256 amountEth, uint256 amount1` (public)



### <span id="MockUniswapV2PairLiquidity-withdrawFei-address-uint256-"></span> `withdrawFei(address to, uint256 amount)` (public)



### <span id="MockUniswapV2PairLiquidity-burnToken-address-struct-Decimal-D256-"></span> `burnToken(address to, struct Decimal.D256 ratio) → uint256 amount0, uint256 amount1` (public)



### <span id="MockUniswapV2PairLiquidity-swap-uint256-uint256-address-bytes-"></span> `swap(uint256 amount0Out, uint256 amount1Out, address to, bytes)` (external)



### <span id="MockUniswapV2PairLiquidity-sync--"></span> `sync()` (external)



### <span id="MockUniswapV2PairLiquidity-totalSupply--"></span> `totalSupply() → uint256` (public)

See {IERC20-totalSupply}.

### <span id="MockUniswapV2PairLiquidity-balanceOf-address-"></span> `balanceOf(address account) → uint256` (public)

See {IERC20-balanceOf}.

### <span id="MockUniswapV2PairLiquidity-transfer-address-uint256-"></span> `transfer(address recipient, uint256 amount) → bool` (public)

See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`.

### <span id="MockUniswapV2PairLiquidity-allowance-address-address-"></span> `allowance(address owner, address spender) → uint256` (public)

See {IERC20-allowance}.

### <span id="MockUniswapV2PairLiquidity-approve-address-uint256-"></span> `approve(address spender, uint256 amount) → bool` (public)

See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address.

### <span id="MockUniswapV2PairLiquidity-transferFrom-address-address-uint256-"></span> `transferFrom(address sender, address recipient, uint256 amount) → bool` (public)

See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20};

Requirements:
- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for `sender`'s tokens of at least
`amount`.

### <span id="MockUniswapV2PairLiquidity-increaseAllowance-address-uint256-"></span> `increaseAllowance(address spender, uint256 addedValue) → bool` (public)

Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

### <span id="MockUniswapV2PairLiquidity-decreaseAllowance-address-uint256-"></span> `decreaseAllowance(address spender, uint256 subtractedValue) → bool` (public)

Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`.

### <span id="MockUniswapV2PairLiquidity-_transfer-address-address-uint256-"></span> `_transfer(address sender, address recipient, uint256 amount)` (internal)

Moves tokens `amount` from `sender` to `recipient`.

This is internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.

### <span id="MockUniswapV2PairLiquidity-_mint-address-uint256-"></span> `_mint(address account, uint256 amount)` (internal)

Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements

- `to` cannot be the zero address.

### <span id="MockUniswapV2PairLiquidity-_burn-address-uint256-"></span> `_burn(address account, uint256 amount)` (internal)

Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens.

### <span id="MockUniswapV2PairLiquidity-_approve-address-address-uint256-"></span> `_approve(address owner, address spender, uint256 amount)` (internal)

Sets `amount` as the allowance of `spender` over the `owner`s tokens.

This is internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address.

### <span id="MockUniswapV2PairLiquidity-_burnFrom-address-uint256-"></span> `_burnFrom(address account, uint256 amount)` (internal)

Destroys `amount` tokens from `account`.`amount` is then deducted
from the caller's allowance.

See {_burn} and {_approve}.

