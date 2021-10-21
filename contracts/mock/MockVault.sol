// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockWeightedPool.sol";

contract MockVault {

    MockWeightedPool public _pool;
    IERC20[] public _tokens;
    uint256 public constant LIQUIDITY_AMOUNT = 1e18;

    constructor(IERC20[] memory tokens, address owner) {
        _tokens = tokens;
        _pool = new MockWeightedPool(IVault(address(this)), owner);
    }

    function getPoolTokens(bytes32 poolId)
        external
        view
        returns (
            IERC20[] memory tokens,
            uint256[] memory balances,
            uint256 lastChangeBlock
        ) {
            return (_tokens, balances, lastChangeBlock);
        }

    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory request
    ) external payable {
        _pool.mint(recipient, LIQUIDITY_AMOUNT);
    }

    struct JoinPoolRequest {
        IAsset[] assets;
        uint256[] maxAmountsIn;
        bytes userData;
        bool fromInternalBalance;
    }

    function exitPool(
        bytes32 poolId,
        address sender,
        address payable recipient,
        ExitPoolRequest memory request
    ) external {
        _pool.burnFrom(sender, LIQUIDITY_AMOUNT);
    }

    struct ExitPoolRequest {
        IAsset[] assets;
        uint256[] minAmountsOut;
        bytes userData;
        bool toInternalBalance;
    }
}
