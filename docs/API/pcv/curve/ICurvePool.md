## `ICurvePool`






### `coins(uint256 arg0) → address` (external)





### `balances(uint256 arg0) → uint256` (external)





### `fee() → uint256` (external)





### `admin_fee() → uint256` (external)





### `owner() → address` (external)





### `lp_token() → address` (external)





### `initial_A() → uint256` (external)





### `future_A() → uint256` (external)





### `initial_A_time() → uint256` (external)





### `future_A_time() → uint256` (external)





### `admin_actions_deadline() → uint256` (external)





### `transfer_ownership_deadline() → uint256` (external)





### `future_fee() → uint256` (external)





### `future_admin_fee() → uint256` (external)





### `future_owner() → address` (external)





### `decimals() → uint256` (external)





### `transfer(address _to, uint256 _value) → bool` (external)





### `transferFrom(address _from, address _to, uint256 _value) → bool` (external)





### `approve(address _spender, uint256 _value) → bool` (external)





### `totalSupply() → uint256` (external)





### `mint(address _to, uint256 _value) → bool` (external)





### `burnFrom(address _to, uint256 _value) → bool` (external)





### `balanceOf(address _owner) → uint256` (external)





### `A() → uint256` (external)





### `get_virtual_price() → uint256` (external)





### `get_dy(int128 i, int128 j, uint256 dx) → uint256` (external)





### `get_dy_underlying(int128 i, int128 j, uint256 dx) → uint256` (external)





### `exchange(int128 i, int128 j, uint256 dx, uint256 min_dy)` (external)





### `calc_withdraw_one_coin(uint256 _token_amount, int128 i) → uint256` (external)





### `remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 min_amount)` (external)





### `ramp_A(uint256 _future_A, uint256 _future_time)` (external)





### `stop_ramp_A()` (external)





### `commit_new_fee(uint256 new_fee, uint256 new_admin_fee)` (external)





### `apply_new_fee()` (external)





### `commit_transfer_ownership(address _owner)` (external)





### `apply_transfer_ownership()` (external)





### `revert_transfer_ownership()` (external)





### `admin_balances(uint256 i) → uint256` (external)





### `withdraw_admin_fees()` (external)





### `donate_admin_fees()` (external)





### `kill_me()` (external)





### `unkill_me()` (external)








