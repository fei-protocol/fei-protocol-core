// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockWeightedPool.sol";

contract MockVault {
    using SafeERC20 for IERC20;

    MockWeightedPool public _pool;
    IERC20[] public _tokens;
    uint256 public constant LIQUIDITY_AMOUNT = 1e18;
    bool public mockDoTransfers = false;

    constructor(IERC20[] memory tokens, address owner) {
        _tokens = tokens;
        _pool = new MockWeightedPool(MockVault(address(this)), owner);
    }

    function setMockDoTransfers(bool flag) external {
        mockDoTransfers = flag;
    }

    enum PoolSpecialization { GENERAL, MINIMAL_SWAP_INFO, TWO_TOKEN }
    function getPool(bytes32 poolId) external view returns (
        address poolAddress,
        PoolSpecialization poolSpec
    ) {
        poolAddress = address(_pool);
        poolSpec = PoolSpecialization.TWO_TOKEN;
    }

    function getPoolTokens(bytes32 poolId)
        external
        view
        returns (
            IERC20[] memory tokens,
            uint256[] memory balances,
            uint256 lastChangeBlock
        ) {
            balances = new uint256[](2);
            balances[0] = _tokens[0].balanceOf(address(_pool));
            balances[1] = _tokens[1].balanceOf(address(_pool));
            return (_tokens, balances, lastChangeBlock);
        }

    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory request
    ) external payable {
        if (mockDoTransfers) {
            _tokens[0].safeTransferFrom(msg.sender, address(_pool), request.maxAmountsIn[0]);
            _tokens[1].safeTransferFrom(msg.sender, address(_pool), request.maxAmountsIn[1]);
        }
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
        _pool.mockBurn(sender, LIQUIDITY_AMOUNT);
        if (mockDoTransfers) {
            _pool.mockInitApprovals();
            if (request.minAmountsOut[0] == 0 && request.minAmountsOut[1] == 0) {
                // transfer all
                _tokens[0].safeTransferFrom(address(_pool), recipient, _tokens[0].balanceOf(address(_pool)));
                _tokens[1].safeTransferFrom(address(_pool), recipient, _tokens[1].balanceOf(address(_pool)));
            } else {
                _tokens[0].safeTransferFrom(address(_pool), recipient, request.minAmountsOut[0]);
                _tokens[1].safeTransferFrom(address(_pool), recipient, request.minAmountsOut[1]);
            }
        }
    }

    struct ExitPoolRequest {
        IAsset[] assets;
        uint256[] minAmountsOut;
        bytes userData;
        bool toInternalBalance;
    }
}
