// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./ICurvePool.sol";
import "../IPCVDeposit.sol";
import "../IPCVSwapper.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../../core/TribeRoles.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title CurveSwapper
/// @author eswak
/// @notice a contract that performs swaps on Curve.
/// @dev this implementation assumes a StableSwap metapool, where `tokenSpent` or
/// `tokenReceived` is the `curvePool.coins(0)` or `curvePool.coins(1)`, and the
/// other is a Curve BasePool that contains the second token.
contract CurveSwapper is CoreRef, IPCVSwapper {
    using SafeERC20 for IERC20;

    address private constant ERC20_3CRV = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
    address private constant CURVE_3POOL = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;

    // ------------- Events -------------

    event WithdrawERC20(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);
    event UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints);

    // -------------- State -------------
    /// @notice the Curve pool used for swapping
    address public immutable curvePool;
    /// @notice the index of `tokenSpent` in `curvePool` for underlying swap
    int128 public immutable i;
    /// @notice the index of `tokenReceived` in `curvePool` for underlying swap
    int128 public immutable j;

    /// @notice the token to sell
    address public immutable override tokenSpent;

    /// @notice the token to buy
    address public immutable override tokenReceived;

    /// @notice the address to send `tokenReceived`
    address public override tokenReceivingAddress;

    // @notice Maximum tolerated slippage for swaps in basis points (10_000)
    uint256 public maxSlippageBps;

    /**
    @notice constructor for CurveSwapper
    @param _core Core contract to reference
    @param _curvePool the Curve pool used to swap
    @param _tokenSpent the token to be auctioned
    @param _tokenReceived the token to buy
    @param _tokenReceivingAddress the address to send `tokenReceived`
    @param _maxSlippageBps the maximum tolerated slippage for swaps in basis points (10_000)
     */
    constructor(
        address _core,
        address _curvePool,
        address _tokenSpent,
        address _tokenReceived,
        address _tokenReceivingAddress,
        uint256 _maxSlippageBps
    ) CoreRef(_core) {
        curvePool = _curvePool;
        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;
        _setReceivingAddress(_tokenReceivingAddress);
        _setMaximumSlippage(_maxSlippageBps);

        // find the i and j index for underlying swap, where
        // i = _tokenSpent, and j = _tokenReceived
        address coins0 = ICurvePool(_curvePool).coins(0);
        address coins1 = ICurvePool(_curvePool).coins(1);
        address _basePool;
        int128 _i;
        int128 _j;
        if (_tokenSpent == coins0) {
            _basePool = coins1;
            if (coins1 == ERC20_3CRV) _basePool = CURVE_3POOL;

            _i = 0;
            bool j1 = ICurvePool(_basePool).coins(0) == _tokenReceived;
            if (j1) _j = 1;
            else {
                bool j2 = ICurvePool(_basePool).coins(1) == _tokenReceived;
                if (j2) _j = 2;
                else {
                    bool j3 = ICurvePool(_basePool).coins(2) == _tokenReceived;
                    if (j3) {
                        _j = 3;
                    } else {
                        address coins3 = ICurvePool(_basePool).coins(3);
                        require(_tokenReceived == coins3, "CurveSwapper: tokenReceived not found");
                        _j = 4;
                    }
                }
            }
        } else {
            require(_tokenSpent == coins1, "CurveSwapper: tokenSpent not found");
            _basePool = coins0;
            if (coins0 == ERC20_3CRV) _basePool = CURVE_3POOL;

            _j = 0;
            bool i1 = ICurvePool(_basePool).coins(0) == _tokenSpent;
            if (i1) _i = 1;
            else {
                bool i2 = ICurvePool(_basePool).coins(1) == _tokenSpent;
                if (i2) _i = 2;
                else {
                    bool i3 = ICurvePool(_basePool).coins(2) == _tokenSpent;
                    if (i3) {
                        _i = 3;
                    } else {
                        address coins3 = ICurvePool(_basePool).coins(3);
                        require(_tokenSpent == coins3, "CurveSwapper: tokenSpent not found");
                        _i = 4;
                    }
                }
            }
        }

        i = _i;
        j = _j;
    }

    /// @notice performs a swap
    function swap()
        external
        override
        whenNotPaused
        hasAnyOfFourRoles(
            TribeRoles.GUARDIAN,
            TribeRoles.SWAP_ADMIN_ROLE,
            TribeRoles.PCV_CONTROLLER,
            TribeRoles.GOVERNOR
        )
    {
        uint256 dx = IERC20(tokenSpent).balanceOf(address(this));
        uint256 minDy = (dx * (Constants.BASIS_POINTS_GRANULARITY - maxSlippageBps)) /
            Constants.BASIS_POINTS_GRANULARITY;
        IERC20(tokenSpent).safeApprove(curvePool, dx);
        ICurvePool(curvePool).exchange_underlying(i, j, dx, minDy, tokenReceivingAddress);
        IPCVDeposit(tokenReceivingAddress).deposit();
    }

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) public onlyPCVController {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }

    /// @notice Sets the address receiving swap's outbound tokens
    /// @param newTokenReceivingAddress the address that will receive tokens
    function setReceivingAddress(address newTokenReceivingAddress)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.SWAP_ADMIN_ROLE, TribeRoles.PCV_CONTROLLER, TribeRoles.GOVERNOR)
    {
        _setReceivingAddress(newTokenReceivingAddress);
    }

    function _setReceivingAddress(address newTokenReceivingAddress) internal {
        require(newTokenReceivingAddress != address(0), "CurveSwapper: zero address");
        address oldTokenReceivingAddress = tokenReceivingAddress;
        tokenReceivingAddress = newTokenReceivingAddress;
        emit UpdateReceivingAddress(oldTokenReceivingAddress, newTokenReceivingAddress);
    }

    /// @notice Sets the maximum slippage vs 1:1 price accepted during swap.
    /// @param _maximumSlippageBasisPoints the maximum slippage expressed in basis points (1/10_000)
    function setMaximumSlippage(uint256 _maximumSlippageBasisPoints)
        external
        hasAnyOfThreeRoles(TribeRoles.SWAP_ADMIN_ROLE, TribeRoles.PCV_CONTROLLER, TribeRoles.GOVERNOR)
    {
        _setMaximumSlippage(_maximumSlippageBasisPoints);
    }

    function _setMaximumSlippage(uint256 _maximumSlippageBasisPoints) internal {
        require(
            _maximumSlippageBasisPoints <= Constants.BASIS_POINTS_GRANULARITY,
            "CurveSwapper: Exceeds bp granularity."
        );
        maxSlippageBps = _maximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(_maximumSlippageBasisPoints);
    }
}
