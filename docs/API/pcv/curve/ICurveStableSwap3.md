## <span id="ICurveStableSwap3"></span> `ICurveStableSwap3`



- [`__init__(address _owner, address[3] _coins, address _pool_token, uint256 _A, uint256 _fee, uint256 _admin_fee)`][ICurveStableSwap3-__init__-address-address-3--address-uint256-uint256-uint256-]
- [`get_balances()`][ICurveStableSwap3-get_balances--]
- [`calc_token_amount(uint256[3] amounts, bool deposit)`][ICurveStableSwap3-calc_token_amount-uint256-3--bool-]
- [`add_liquidity(uint256[3] amounts, uint256 min_mint_amount)`][ICurveStableSwap3-add_liquidity-uint256-3--uint256-]
- [`remove_liquidity(uint256 _amount, uint256[3] min_amounts)`][ICurveStableSwap3-remove_liquidity-uint256-uint256-3--]
- [`remove_liquidity_imbalance(uint256[3] amounts, uint256 max_burn_amount)`][ICurveStableSwap3-remove_liquidity_imbalance-uint256-3--uint256-]
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
### <span id="ICurveStableSwap3-__init__-address-address-3--address-uint256-uint256-uint256-"></span> `__init__(address _owner, address[3] _coins, address _pool_token, uint256 _A, uint256 _fee, uint256 _admin_fee)` (external)



### <span id="ICurveStableSwap3-get_balances--"></span> `get_balances() → uint256[3]` (external)



### <span id="ICurveStableSwap3-calc_token_amount-uint256-3--bool-"></span> `calc_token_amount(uint256[3] amounts, bool deposit) → uint256` (external)



### <span id="ICurveStableSwap3-add_liquidity-uint256-3--uint256-"></span> `add_liquidity(uint256[3] amounts, uint256 min_mint_amount)` (external)



### <span id="ICurveStableSwap3-remove_liquidity-uint256-uint256-3--"></span> `remove_liquidity(uint256 _amount, uint256[3] min_amounts)` (external)



### <span id="ICurveStableSwap3-remove_liquidity_imbalance-uint256-3--uint256-"></span> `remove_liquidity_imbalance(uint256[3] amounts, uint256 max_burn_amount)` (external)



