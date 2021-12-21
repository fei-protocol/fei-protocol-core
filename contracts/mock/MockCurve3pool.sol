// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";

contract MockCurve3pool is MockERC20 {
  address[3] public coins;
  uint256 public slippage = 0; // in bp

  constructor(address _dai, address _usdc, address _usdt) {
    coins[0] = _dai;
    coins[1] = _usdc;
    coins[2] = _usdt;
  }

  function set_slippage(uint256 _slippage) public {
    slippage = _slippage;
  }

  function add_liquidity(uint256[3] memory amounts, uint256 min_mint_amount) public {
    IERC20(coins[0]).transferFrom(msg.sender, address(this), amounts[0]);
    IERC20(coins[1]).transferFrom(msg.sender, address(this), amounts[1]);
    IERC20(coins[2]).transferFrom(msg.sender, address(this), amounts[2]);
    uint256 totalTokens = (amounts[0] + amounts[1] + amounts[2]) * (10000 - slippage) / 10000;
    MockERC20(this).mint(msg.sender, totalTokens);
  }

  function balances(uint256 i) public view returns (uint256){
    return IERC20(coins[i]).balanceOf(address(this));
  }

  function remove_liquidity(uint256 _amount, uint256[3] memory min_amounts) public {
    uint256[3] memory amounts;
    amounts[0] = _amount / 3;
    amounts[1] = _amount / 3;
    amounts[2] = _amount / 3;
    IERC20(coins[0]).transfer(msg.sender, amounts[0]);
    IERC20(coins[1]).transfer(msg.sender, amounts[1]);
    IERC20(coins[2]).transfer(msg.sender, amounts[2]);
    MockERC20(this).mockBurn(msg.sender, _amount);
  }

  function remove_liquidity_one_coin(uint256 _amount, int128 i, uint256 min_amount) public {
    uint256 _amountOut = _amount * (10000 - slippage) / 10000;
    _amountOut = _amountOut * 100000 / 100015; // 0.015% fee
    IERC20(coins[uint256(uint128(i))]).transfer(msg.sender, _amountOut);
    MockERC20(this).mockBurn(msg.sender, _amount);
  }

  function get_virtual_price() public pure returns (uint256) {
    return 1000000000000000000;
  }

  function calc_withdraw_one_coin(uint256 _token_amount, int128 i) public view returns (uint256) {
    uint256 _amountOut = _token_amount * (10000 - slippage) / 10000;
    _amountOut = _amountOut * 100000 / 100015; // 0.015% fee
    return _amountOut;
  }
}
