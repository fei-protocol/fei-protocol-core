## `MockUniswapV2PairLiquidity`






### `constructor(address _token0, address _token1)` (public)





### `getReserves() → uint112, uint112, uint32` (external)





### `mint(address to) → uint256` (public)





### `mintAmount(address to, uint256 _liquidity)` (public)





### `set(uint112 newReserve0, uint112 newReserve1, uint256 newLiquidity)` (external)





### `setReserves(uint112 newReserve0, uint112 newReserve1)` (external)





### `faucet(address account, uint256 amount) → bool` (external)





### `burnEth(address to, struct Decimal.D256 ratio) → uint256 amountEth, uint256 amount1` (public)





### `withdrawFei(address to, uint256 amount)` (public)





### `burnToken(address to, struct Decimal.D256 ratio) → uint256 amount0, uint256 amount1` (public)





### `swap(uint256 amount0Out, uint256 amount1Out, address to, bytes)` (external)





### `sync()` (external)





### `totalSupply() → uint256` (public)



See {IERC20-totalSupply}.

### `balanceOf(address account) → uint256` (public)



See {IERC20-balanceOf}.

### `transfer(address recipient, uint256 amount) → bool` (public)



See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`.

### `allowance(address owner, address spender) → uint256` (public)



See {IERC20-allowance}.

### `approve(address spender, uint256 amount) → bool` (public)



See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address.

### `transferFrom(address sender, address recipient, uint256 amount) → bool` (public)



See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20};

Requirements:
- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for `sender`'s tokens of at least
`amount`.

### `increaseAllowance(address spender, uint256 addedValue) → bool` (public)



Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

### `decreaseAllowance(address spender, uint256 subtractedValue) → bool` (public)



Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`.

### `_transfer(address sender, address recipient, uint256 amount)` (internal)



Moves tokens `amount` from `sender` to `recipient`.

This is internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.

### `_mint(address account, uint256 amount)` (internal)



Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements

- `to` cannot be the zero address.

### `_burn(address account, uint256 amount)` (internal)



Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens.

### `_approve(address owner, address spender, uint256 amount)` (internal)



Sets `amount` as the allowance of `spender` over the `owner`s tokens.

This is internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address.

### `_burnFrom(address account, uint256 amount)` (internal)



Destroys `amount` tokens from `account`.`amount` is then deducted
from the caller's allowance.

See {_burn} and {_approve}.




