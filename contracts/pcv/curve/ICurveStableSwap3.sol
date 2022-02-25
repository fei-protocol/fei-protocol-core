// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ICurvePool.sol";

interface ICurveStableSwap3 is ICurvePool {
    // Deployment
    function __init__(
        address _owner,
        address[3] memory _coins,
        address _pool_token,
        uint256 _A,
        uint256 _fee,
        uint256 _admin_fee
    ) external;

    // Public property getters
    function get_balances() external view returns (uint256[3] memory);

    // 3Pool
    function calc_token_amount(uint256[3] memory amounts, bool deposit)
        external
        view
        returns (uint256);

    function add_liquidity(uint256[3] memory amounts, uint256 min_mint_amount)
        external;

    function remove_liquidity(uint256 _amount, uint256[3] memory min_amounts)
        external;

    function remove_liquidity_imbalance(
        uint256[3] memory amounts,
        uint256 max_burn_amount
    ) external;
}
