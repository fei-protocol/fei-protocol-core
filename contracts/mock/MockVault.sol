// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockWeightedPool.sol";

contract MockVault {
    using SafeERC20 for IERC20;

    MockWeightedPool public _pool;
    IERC20[] public _tokens;
    uint256[] public _balances;
    uint256 public constant LIQUIDITY_AMOUNT = 1e18;
    bool public mockDoTransfers = false;
    bool public mockBalancesSet = false;

    constructor(IERC20[] memory tokens, address owner) {
        _tokens = tokens;
        _pool = new MockWeightedPool(MockVault(address(this)), owner);

        uint256[] memory weights = new uint256[](tokens.length);
        uint256 weight = 1e18 / tokens.length;
        for (uint256 i = 0; i < weights.length; i++) {
            weights[i] = weight;
        }
        _pool.mockSetNormalizedWeights(weights);
    }

    function setMockDoTransfers(bool flag) external {
        mockDoTransfers = flag;
    }

    enum PoolSpecialization {
        GENERAL,
        MINIMAL_SWAP_INFO,
        TWO_TOKEN
    }

    function getPool(bytes32 poolId)
        external
        view
        returns (address poolAddress, PoolSpecialization poolSpec)
    {
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
        )
    {
        if (mockBalancesSet) {
            balances = _balances;
        } else {
            balances = new uint256[](_tokens.length);
            for (uint256 i = 0; i < _tokens.length; i++) {
                balances[i] = _tokens[i].balanceOf(address(_pool));
            }
        }
        return (_tokens, balances, lastChangeBlock);
    }

    function setBalances(uint256[] memory balances) external {
        _balances = balances;
        mockBalancesSet = true;
    }

    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory request
    ) external payable {
        if (mockDoTransfers) {
            for (uint256 i = 0; i < _tokens.length; i++) {
                _tokens[i].safeTransferFrom(
                    msg.sender,
                    address(_pool),
                    request.maxAmountsIn[i]
                );
            }
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
            if (
                request.minAmountsOut[0] == 0 && request.minAmountsOut[1] == 0
            ) {
                // transfer all
                for (uint256 i = 0; i < _tokens.length; i++) {
                    _tokens[i].safeTransferFrom(
                        address(_pool),
                        recipient,
                        _tokens[i].balanceOf(address(_pool))
                    );
                }
            } else {
                for (uint256 i = 0; i < _tokens.length; i++) {
                    _tokens[i].safeTransferFrom(
                        address(_pool),
                        recipient,
                        request.minAmountsOut[i]
                    );
                }
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
