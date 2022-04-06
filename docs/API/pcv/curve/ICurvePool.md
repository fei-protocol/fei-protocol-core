## <span id="ICurvePool"></span> `ICurvePool`



- [`coins(uint256 arg0)`][ICurvePool-coins-uint256-]
- [`balances(uint256 arg0)`][ICurvePool-balances-uint256-]
- [`fee()`][ICurvePool-fee--]
- [`admin_fee()`][ICurvePool-admin_fee--]
- [`owner()`][ICurvePool-owner--]
- [`lp_token()`][ICurvePool-lp_token--]
- [`initial_A()`][ICurvePool-initial_A--]
- [`future_A()`][ICurvePool-future_A--]
- [`initial_A_time()`][ICurvePool-initial_A_time--]
- [`future_A_time()`][ICurvePool-future_A_time--]
- [`admin_actions_deadline()`][ICurvePool-admin_actions_deadline--]
- [`transfer_ownership_deadline()`][ICurvePool-transfer_ownership_deadline--]
- [`future_fee()`][ICurvePool-future_fee--]
- [`future_admin_fee()`][ICurvePool-future_admin_fee--]
- [`future_owner()`][ICurvePool-future_owner--]
- [`decimals()`][ICurvePool-decimals--]
- [`transfer(address _to, uint256 _value)`][ICurvePool-transfer-address-uint256-]
- [`transferFrom(address _from, address _to, uint256 _value)`][ICurvePool-transferFrom-address-address-uint256-]
- [`approve(address _spender, uint256 _value)`][ICurvePool-approve-address-uint256-]
- [`totalSupply()`][ICurvePool-totalSupply--]
- [`mint(address _to, uint256 _value)`][ICurvePool-mint-address-uint256-]
- [`burnFrom(address _to, uint256 _value)`][ICurvePool-burnFrom-address-uint256-]
- [`balanceOf(address _owner)`][ICurvePool-balanceOf-address-]
- [`A()`][ICurvePool-A--]
- [`get_virtual_price()`][ICurvePool-get_virtual_price--]
- [`get_dy(int128 i, int128 j, uint256 dx)`][ICurvePool-get_dy-int128-int128-uint256-]
- [`get_dy_underlying(int128 i, int128 j, uint256 dx)`][ICurvePool-get_dy_underlying-int128-int128-uint256-]
- [`exchange(int128 i, int128 j, uint256 dx, uint256 min_dy)`][ICurvePool-exchange-int128-int128-uint256-uint256-]
- [`calc_withdraw_one_coin(uint256 _token_amount, int128 i)`][ICurvePool-calc_withdraw_one_coin-uint256-int128-]
- [`remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 min_amount)`][ICurvePool-remove_liquidity_one_coin-uint256-int128-uint256-]
- [`ramp_A(uint256 _future_A, uint256 _future_time)`][ICurvePool-ramp_A-uint256-uint256-]
- [`stop_ramp_A()`][ICurvePool-stop_ramp_A--]
- [`commit_new_fee(uint256 new_fee, uint256 new_admin_fee)`][ICurvePool-commit_new_fee-uint256-uint256-]
- [`apply_new_fee()`][ICurvePool-apply_new_fee--]
- [`commit_transfer_ownership(address _owner)`][ICurvePool-commit_transfer_ownership-address-]
- [`apply_transfer_ownership()`][ICurvePool-apply_transfer_ownership--]
- [`revert_transfer_ownership()`][ICurvePool-revert_transfer_ownership--]
- [`admin_balances(uint256 i)`][ICurvePool-admin_balances-uint256-]
- [`withdraw_admin_fees()`][ICurvePool-withdraw_admin_fees--]
- [`donate_admin_fees()`][ICurvePool-donate_admin_fees--]
- [`kill_me()`][ICurvePool-kill_me--]
- [`unkill_me()`][ICurvePool-unkill_me--]
### <span id="ICurvePool-coins-uint256-"></span> `coins(uint256 arg0) → address` (external)



### <span id="ICurvePool-balances-uint256-"></span> `balances(uint256 arg0) → uint256` (external)



### <span id="ICurvePool-fee--"></span> `fee() → uint256` (external)



### <span id="ICurvePool-admin_fee--"></span> `admin_fee() → uint256` (external)



### <span id="ICurvePool-owner--"></span> `owner() → address` (external)



### <span id="ICurvePool-lp_token--"></span> `lp_token() → address` (external)



### <span id="ICurvePool-initial_A--"></span> `initial_A() → uint256` (external)



### <span id="ICurvePool-future_A--"></span> `future_A() → uint256` (external)



### <span id="ICurvePool-initial_A_time--"></span> `initial_A_time() → uint256` (external)



### <span id="ICurvePool-future_A_time--"></span> `future_A_time() → uint256` (external)



### <span id="ICurvePool-admin_actions_deadline--"></span> `admin_actions_deadline() → uint256` (external)



### <span id="ICurvePool-transfer_ownership_deadline--"></span> `transfer_ownership_deadline() → uint256` (external)



### <span id="ICurvePool-future_fee--"></span> `future_fee() → uint256` (external)



### <span id="ICurvePool-future_admin_fee--"></span> `future_admin_fee() → uint256` (external)



### <span id="ICurvePool-future_owner--"></span> `future_owner() → address` (external)



### <span id="ICurvePool-decimals--"></span> `decimals() → uint256` (external)



### <span id="ICurvePool-transfer-address-uint256-"></span> `transfer(address _to, uint256 _value) → bool` (external)



### <span id="ICurvePool-transferFrom-address-address-uint256-"></span> `transferFrom(address _from, address _to, uint256 _value) → bool` (external)



### <span id="ICurvePool-approve-address-uint256-"></span> `approve(address _spender, uint256 _value) → bool` (external)



### <span id="ICurvePool-totalSupply--"></span> `totalSupply() → uint256` (external)



### <span id="ICurvePool-mint-address-uint256-"></span> `mint(address _to, uint256 _value) → bool` (external)



### <span id="ICurvePool-burnFrom-address-uint256-"></span> `burnFrom(address _to, uint256 _value) → bool` (external)



### <span id="ICurvePool-balanceOf-address-"></span> `balanceOf(address _owner) → uint256` (external)



### <span id="ICurvePool-A--"></span> `A() → uint256` (external)



### <span id="ICurvePool-get_virtual_price--"></span> `get_virtual_price() → uint256` (external)



### <span id="ICurvePool-get_dy-int128-int128-uint256-"></span> `get_dy(int128 i, int128 j, uint256 dx) → uint256` (external)



### <span id="ICurvePool-get_dy_underlying-int128-int128-uint256-"></span> `get_dy_underlying(int128 i, int128 j, uint256 dx) → uint256` (external)



### <span id="ICurvePool-exchange-int128-int128-uint256-uint256-"></span> `exchange(int128 i, int128 j, uint256 dx, uint256 min_dy)` (external)



### <span id="ICurvePool-calc_withdraw_one_coin-uint256-int128-"></span> `calc_withdraw_one_coin(uint256 _token_amount, int128 i) → uint256` (external)



### <span id="ICurvePool-remove_liquidity_one_coin-uint256-int128-uint256-"></span> `remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 min_amount)` (external)



### <span id="ICurvePool-ramp_A-uint256-uint256-"></span> `ramp_A(uint256 _future_A, uint256 _future_time)` (external)



### <span id="ICurvePool-stop_ramp_A--"></span> `stop_ramp_A()` (external)



### <span id="ICurvePool-commit_new_fee-uint256-uint256-"></span> `commit_new_fee(uint256 new_fee, uint256 new_admin_fee)` (external)



### <span id="ICurvePool-apply_new_fee--"></span> `apply_new_fee()` (external)



### <span id="ICurvePool-commit_transfer_ownership-address-"></span> `commit_transfer_ownership(address _owner)` (external)



### <span id="ICurvePool-apply_transfer_ownership--"></span> `apply_transfer_ownership()` (external)



### <span id="ICurvePool-revert_transfer_ownership--"></span> `revert_transfer_ownership()` (external)



### <span id="ICurvePool-admin_balances-uint256-"></span> `admin_balances(uint256 i) → uint256` (external)



### <span id="ICurvePool-withdraw_admin_fees--"></span> `withdraw_admin_fees()` (external)



### <span id="ICurvePool-donate_admin_fees--"></span> `donate_admin_fees()` (external)



### <span id="ICurvePool-kill_me--"></span> `kill_me()` (external)



### <span id="ICurvePool-unkill_me--"></span> `unkill_me()` (external)



